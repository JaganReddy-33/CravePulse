"""Exercise real HTTP/database flows against disposable cravepulse_test, never the app DB."""
from pathlib import Path
import os, re, json, secrets, subprocess, time, urllib.request, urllib.error, http.cookiejar, shutil

ROOT=Path(__file__).resolve().parents[1]
os.chdir(ROOT)
props={}
for line in (ROOT/'backend/src/main/resources/application.properties').read_text().splitlines():
    if '=' in line and not line.lstrip().startswith('#'):
        key,value=line.split('=',1);props[key.strip()]=value.strip()
env=os.environ.copy()
url=env.get('DB_URL') or props['db.url']
env['DB_URL']=re.sub(r'/[^/?]+(?=\?|$)','/cravepulse_test',url)
assert '/cravepulse_test' in env['DB_URL']
env['DB_USER']=env.get('DB_USER') or props.get('db.user') or props.get('db.username','')
env['DB_PASSWORD']=env.get('DB_PASSWORD') or props.get('db.password','')
env['JWT_SECRET']=secrets.token_urlsafe(48)
env['PORT']='8082'
env['RAZORPAY_KEY_ID']=''
runtime=ROOT/'.local-runtime';runtime.mkdir(exist_ok=True)
jar=str(runtime/('api-test-'+secrets.token_hex(4)+'.jar'))
shutil.copy2(ROOT/'backend/target-verified/food-delivery-backend.jar',jar)
base='http://127.0.0.1:8082/api'
password=secrets.token_urlsafe(20)+'aA1!'
suffix=secrets.token_hex(4)
logdir=ROOT/'.local-backups';logdir.mkdir(exist_ok=True)
checks=[]
class Client:
    def __init__(self):
        self.cookies=http.cookiejar.CookieJar()
        self.opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cookies))
        self.token=None
    def request(self,path,method='GET',body=None,status=200,headers=None):
        h={'Content-Type':'application/json',**(headers or {})}
        if self.token:h['Authorization']='Bearer '+self.token
        req=urllib.request.Request(base+path,data=json.dumps(body).encode() if body is not None else None,headers=h,method=method)
        try:
            with self.opener.open(req,timeout=45) as res: code=res.status; raw=res.read(); content=res.headers.get('Content-Type','')
        except urllib.error.HTTPError as error: code=error.code;raw=error.read();content=error.headers.get('Content-Type','')
        payload=json.loads(raw) if 'json' in content else raw.decode()
        assert code==status, f'{method} {path}: expected {status}, got {code}: {payload}'
        if status<400 and isinstance(payload,dict) and 'success' in payload: assert payload['success'], f'{path}: {payload}'
        checks.append(f'{method} {path} -> {code}')
        return payload.get('data') if isinstance(payload,dict) and 'data' in payload else payload
    def register(self,name,tag):
        email=f'{tag}-{suffix}@example.invalid'
        result=self.request('/auth/register','POST',{'fullName':name,'email':email,'password':password,'phone':''},201)
        assert 'refreshToken' not in result
        self.token=result['accessToken'];return email,result['user']['id']
    def login(self,email):
        result=self.request('/auth/login','POST',{'email':email,'password':password});self.token=result['accessToken']

with (logdir/'api-verification.log').open('w') as logfile:
    server=subprocess.Popen(['java','-jar',jar],env=env,stdout=logfile,stderr=subprocess.STDOUT)
    try:
        guest=Client()
        for attempt in range(90):
            if server.poll() is not None:raise RuntimeError('Test server failed; see .local-backups/api-verification.log')
            try:guest.request('/health');break
            except (OSError,AssertionError):time.sleep(1)
        else:raise RuntimeError('Test server startup timed out')
        guest.request('/account/cart',status=401)
        guest.request('/admin/users',status=401)
        guest.request('/jobs/applications',status=401)
        admin=Client();admin_email,_=admin.register('Test Administrator','admin')
        subprocess.run(['java','--class-path',jar,'scripts/DatabaseMaintenance.java','promote-test-admin',admin_email],env=env,stdout=logfile,stderr=subprocess.STDOUT,check=True)
        admin.login(admin_email)
        admin.request('/catalog/locations','POST',{'city':'Test city','name':'Test locality','latitude':12.9716,'longitude':77.5946,'radiusKm':10},201)
        assert guest.request('/catalog/locations')
        customer=Client();email,customer_id=customer.register('Test Customer','customer')
        other=Client();other.register('Other Customer','other')
        assert customer.request('/auth/addresses')==[]
        assert customer.request('/auth/wallet')['balance']==0
        customer.request('/account/cart','PUT',{'restaurantId':None,'restaurantName':None,'items':[]})
        assert customer.request('/account/cart')['items']==[]
        assert other.request('/account/cart') is None
        customer.request('/account/preferences','PUT',{'recentSearches':['Soup']})
        assert customer.request('/account/preferences')['recentSearches']==['Soup']
        assert other.request('/account/preferences') is None
        address=customer.request('/auth/addresses','POST',{'title':'Home','addressLine':'Test delivery address','city':'Test city','state':'Test state','postalCode':'560001','latitude':12.972,'longitude':77.595},201)
        assert address['id']
        customer.request('/auth/addresses','POST',{'addressLine':'Missing coordinates'},400)
        support=customer.request('/account/support','POST',{'category':'TECHNICAL_FEEDBACK','message':'An actual stored test support ticket','orderNumber':''},201)
        assert any(ticket['ticketNumber']==support['ticketNumber'] for ticket in customer.request('/account/support'))
        assert other.request('/account/support')==[]
        customer.request('/account/support/inbox',status=403)
        inbox=admin.request('/account/support/inbox');ticket=next(t for t in inbox if t['ticketNumber']==support['ticketNumber'])
        admin.request('/account/support/status','POST',{'id':ticket['id'],'status':'RESOLVED'})
        assert next(t for t in customer.request('/account/support') if t['ticketNumber']==support['ticketNumber'])['status']=='RESOLVED'
        job=admin.request('/jobs','POST',{'title':'Test engineer','department':'Engineering','description':'Real persisted test posting','location':'Remote','status':'ACTIVE'},201)
        job_id=job if isinstance(job,int) else job['id']
        assert any(j['id']==job_id for j in guest.request('/jobs'))
        guest.request('/jobs/apply','POST',{'jobId':job_id,'applicantName':'Test Applicant','email':email,'resumeFilename':'https://example.invalid/resume.pdf'},201)
        assert any(a['jobId']==job_id for a in admin.request('/jobs/applications'))
        guest.request('/jobs','POST',{'title':'Forbidden'},401)
        partner=Client();partner_email=f'partner-{suffix}@example.invalid'
        onboarding=partner.request('/partner/apply','POST',{'fullName':'Test Kitchen Owner','email':partner_email,'password':password,'phone':'','restaurantName':'Test Kitchen','fssaiLicense':'12345678901234','address':'Test kitchen address','latitude':12.9716,'longitude':77.5946,'cuisineTypes':'Soup'},201)
        restaurant_id=onboarding['restaurantId'];partner.login(partner_email)
        admin.request(f'/admin/restaurant/{restaurant_id}/kyc','POST',{'approved':True})
        partner.request(f'/restaurants/{restaurant_id}/toggle-open','POST',{'isOpen':True})
        category=partner.request('/menu/categories','POST',{'restaurantId':restaurant_id,'name':'Test mains'},201)
        item=partner.request('/menu/item','POST',{'restaurantId':restaurant_id,'categoryId':category['id'],'name':'Test soup','dineInPrice':100,'platformPrice':100,'isVeg':True,'isAvailable':True,'prepTimeMinutes':10},201)
        assert item['id']
        menu=guest.request(f'/menu/restaurant/{restaurant_id}');assert any(i['id']==item['id'] for i in menu['items'])
        assert any(r['id']==restaurant_id for r in guest.request('/restaurants'))
        customer.request('/account/favorites','POST',{'restaurantId':restaurant_id,'favorite':True})
        assert restaurant_id in customer.request('/account/favorites');assert other.request('/account/favorites')==[]
        bill=customer.request('/cart/calculate','POST',{'restaurantId':restaurant_id,'items':[{'menuItemId':item['id'],'quantity':1}],'userLat':12.972,'userLng':77.595})
        assert bill['totalAmount']>=100
        order=customer.request('/orders','POST',{'restaurantId':restaurant_id,'deliveryAddressId':address['id'],'paymentMode':'COD','items':[{'menuItemId':item['id'],'quantity':1}],'tipAmount':0},201,{'X-Idempotency-Key':secrets.token_hex(16)})
        order_id=order['id'];assert order['paymentMode']=='COD'
        other.request(f'/orders/{order_id}',status=403)
        assert customer.request(f'/orders/{order_id}')['id']==order_id
        customer.request('/payments/verify','POST',{'razorpayOrderId':'unknown','razorpayPaymentId':'fake','razorpaySignature':'simulated_valid_sig'},400)
        customer.request(f'/orders/{order_id}/messages','POST',{'messageText':'Real persisted order message','recipientRole':'RESTAURANT'},201)
        assert customer.request(f'/orders/{order_id}/messages')
        customer.request(f'/orders/{order_id}/status','POST',{'status':'CANCELLED','reason':'Integration verification complete'})
        assert customer.request(f'/orders/{order_id}')['status']=='CANCELLED'
        rider=Client();rider_email=f'rider-{suffix}@example.invalid'
        rider_application=rider.request('/rider/apply','POST',{'fullName':'Test Rider','email':rider_email,'password':password,'phone':'','vehicleType':'BICYCLE','vehicleNumber':'TEST-'+suffix,'drivingLicense':'TEST-LICENCE-'+suffix},201)
        rider_id=rider_application['riderId'];admin.request(f'/admin/rider/{rider_id}/kyc','POST',{'approved':True});rider.login(rider_email)
        rider.request('/rider/telemetry','POST',{'latitude':12.9716,'longitude':77.5946})
        rider.request('/rider/profile/status','POST',{'online':True})
        delivered_order=customer.request('/orders','POST',{'restaurantId':restaurant_id,'deliveryAddressId':address['id'],'paymentMode':'COD','items':[{'menuItemId':item['id'],'quantity':1}],'tipAmount':0},201,{'X-Idempotency-Key':secrets.token_hex(16)})
        delivery_id=delivered_order['id']
        for state in ['ACCEPTED','PREPARING','READY']:
            partner.request(f'/orders/{delivery_id}/status','POST',{'status':state})
        offer=None
        for attempt in range(20):
            offers=rider.request('/rider/offers');offer=next((o for o in offers if o['orderId']==delivery_id),None)
            if offer:break
            time.sleep(1)
        assert offer,'No real dispatch offer reached the online rider'
        rider.request(f'/rider/{offer["id"]}/accept','POST',{})
        rider.request(f'/rider/orders/{delivery_id}/status','POST',{'status':'ARRIVED_AT_RESTAURANT'})
        rider.request(f'/rider/orders/{delivery_id}/status','POST',{'status':'PICKED_UP'})
        rider.request(f'/rider/orders/{delivery_id}/status','POST',{'status':'DELIVERED','deliveryOtp':'wrong'},400)
        rider.request(f'/rider/orders/{delivery_id}/status','POST',{'status':'DELIVERED','deliveryOtp':delivered_order['deliveryOtp']})
        assert customer.request(f'/orders/{delivery_id}')['status']=='DELIVERED'
        customer.request('/reviews','POST',{'orderId':delivery_id,'foodRating':4,'packagingRating':4,'deliveryRating':5,'reviewText':'Actual test review stored through API'},201)
        assert rider.request('/rider/earnings')['todayEarned']>0
        assert rider.request('/auth/wallet')['balance']>0
        token=customer.token;customer.token=None
        refreshed=customer.request('/auth/refresh','POST',{});assert refreshed['accessToken'];assert 'refreshToken' not in refreshed
        customer.token=refreshed['accessToken'];customer.request('/auth/logout','POST',{})
        customer.token=None;customer.request('/auth/refresh','POST',{},400)
        (ROOT/'docs/API_VERIFICATION_RESULTS.json').write_text(json.dumps({'database':'cravepulse_test','passed':len(checks),'checks':checks},indent=2))
        print(f'PASS: {len(checks)} live API checks against cravepulse_test. Application database untouched.')
    finally:
        server.terminate()
        try:server.wait(timeout=15)
        except subprocess.TimeoutExpired:server.kill()
        if os.environ.get('CLEAR_TEST_DATA') == '1':
            subprocess.run(['java','--class-path',jar,'scripts/DatabaseMaintenance.java','clear-test'],env=env,stdout=logfile,stderr=subprocess.STDOUT,check=True)
