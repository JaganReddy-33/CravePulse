# CravePulse Security Policy & Incident Response

## 1. Supported Versions

| Version | Supported | Status |
|---|---|---|
| `1.0.x` | Yes | Active Production Security Support |
| `< 1.0.0` | No | Deprecated Initial Prototyping Versions |

---

## 2. Reporting Security Vulnerabilities

We take the security of CravePulse, our customer data, partner financial settlements, and delivery partner payouts extremely seriously. If you discover a vulnerability or security exposure:

1. **Do NOT open a public GitHub issue.**
2. Email full technical details, reproduction steps, and potential exploit vectors to **`security@cravepulse.com`**.
3. Include:
   - Specific API endpoint, component, or file path.
   - Proof of concept payload or request trace.
   - Recommended remediation strategy.
4. The security response team will acknowledge your report within **24 hours** and provide a tracked remediation timeline within **72 hours**.

---

## 3. Mandatory Environment Variables & Secret Hygiene

CravePulse strictly prohibits hardcoding API keys, private certificates, or database credentials within repository source code. All secrets must be supplied via environment variables or encrypted secrets managers:

| Variable | Description | Mandatory | Production Recommendation |
|---|---|---|---|
| `JWT_SECRET` | HMAC-SHA256 signing secret for authentication tokens | **YES** | Cryptographically random string >= 64 characters (`openssl rand -hex 64`) |
| `DB_PASSWORD` | MySQL relational database password | **YES** | Strong random alphanumeric password |
| `RAZORPAY_KEY_ID` | Razorpay payment gateway merchant ID | **YES** (for online payments) | Set in production secrets manager |
| `RAZORPAY_KEY_SECRET` | Razorpay webhook and signature verification secret | **YES** (for online payments) | Keep strictly confidential |
| `DB_URL` | JDBC connection string | No (default: localhost:3306) | TLS enabled with `useSSL=true` |
| `DB_USER` | MySQL relational database username | No (default: root) | Principle of least privilege database account |

> [!CAUTION]
> If `JWT_SECRET` is unset or contains weak default strings in production, the application runtime throws a security startup warning and denies token generation.

---

## 4. Secret Rotation Checklist

In the event of an operational secret rotation or potential exposure, follow this exact 5-step checklist:

### Step 1: Invalidate Active JWT User Sessions
Immediately revoke all active user refresh tokens in the database to prevent replay attacks using previously generated refresh tokens:
```sql
UPDATE user_tokens SET revoked = TRUE WHERE revoked = FALSE;
```

### Step 2: Rotate JWT Signing Secret
1. Generate a new cryptographically secure 256-bit secret:
   ```bash
   openssl rand -base64 48
   ```
2. Update `JWT_SECRET` in your environment manager / deployment runner.
3. Restart the backend application instances. All subsequent authentication requests will validate against the new secret.

### Step 3: Rotate Razorpay Payment Gateway Credentials
1. Log in to the [Razorpay Merchant Dashboard](https://dashboard.razorpay.com).
2. Navigate to **Settings -> API Keys** and click **Regenerate Key**. Set the grace period for existing keys if active transactions are in-flight.
3. Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in environment variables.
4. Under **Settings -> Webhooks**, regenerate the webhook signing secret and update `RAZORPAY_WEBHOOK_SECRET`.

### Step 4: Rotate Database Credentials
1. Create a new user password in MySQL:
   ```sql
   ALTER USER 'cravepulse_app'@'%' IDENTIFIED BY 'NewStrongPassword2026!#';
   FLUSH PRIVILEGES;
   ```
2. Update `DB_PASSWORD` in application properties or container environment variables.
3. Perform a rolling restart of backend services and verify `/ready` health probe.

### Step 5: Git Repository & Secrets Audit
1. Run automated secret scanning locally with Gitleaks:
   ```bash
   gitleaks detect --source . --verbose
   ```
2. Verify that `.env`, `.env.local`, and private key files remain untracked and strictly ignored via `.gitignore`.
