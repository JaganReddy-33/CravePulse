import ChangePassword from '../../components/ChangePassword';
import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function RiderProfile() {
  const { user, refreshProfile } = useAuth();
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api.get('/rider/profile').then(res => {
      if (!res.success) throw new Error('Unable to load rider profile');
      setForm({ fullName: user?.fullName || '', phone: user?.phone || '', avatarUrl: user?.avatarUrl || '', vehicleType: res.data.vehicleType || '', vehicleNumber: res.data.vehicleNumber || '', drivingLicense: res.data.drivingLicense || '' });
    }).catch(err => setError(err.message));
  }, [user?.id]);
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setSaved(false); setError('');
    try {
      const rider = await api.post('/rider/profile', { vehicleType: form.vehicleType, vehicleNumber: form.vehicleNumber, drivingLicense: form.drivingLicense });
      if (!rider.success) throw new Error('Rider details were not saved');
      const identity = await api.post('/auth/profile', { fullName: form.fullName, phone: form.phone, avatarUrl: form.avatarUrl });
      if (!identity.success) throw new Error('Identity details were not saved');
      await refreshProfile(); setSaved(true);
    } catch (err) { setError(err.message || 'Unable to save profile. Some fields may need retrying.'); }
    finally { setSaving(false); }
  };
  const field = (key, label, type = 'text', required = true) => <div className="col-12 col-md-6" key={key}><label htmlFor={`rider-${key}`} className="form-label">{label}</label><input id={`rider-${key}`} type={type} className="form-control" required={required} maxLength={key === 'avatarUrl' ? 500 : 100} value={form[key]} onChange={e => { setForm(prev => ({ ...prev, [key]: e.target.value })); setSaved(false); }} /></div>;
  return <section className="container py-4" style={{ maxWidth: 960 }}>
    <h1 className="h3 fw-bold">Your rider profile</h1><p className="text-secondary">Keep your contact and delivery details up to date.</p>
    {error && <div role="alert" className="alert alert-danger">{error}</div>}
    {saved && <div role="status" className="alert alert-success">Profile saved.</div>}
    {!form ? <p role="status">Loading profile...</p> : <form onSubmit={save} className="card p-4"><div className="row g-3">
      {field('fullName', 'Full name')}{field('phone', 'Phone', 'tel')}{field('avatarUrl', 'Profile image URL (optional)', 'url', false)}
      {field('vehicleType', 'Vehicle type')}{field('vehicleNumber', 'Vehicle registration')}{field('drivingLicense', 'Driving licence')}
    </div><div className="mt-4"><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button></div></form>}
    <ChangePassword />
  </section>;
}
