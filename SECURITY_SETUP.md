# 🔒 Security Setup Guide

## ⚠️ CRITICAL: First Time Setup

This guide helps you secure your FX Trading Dashboard after the initial deployment.

---

## 1. Generate and Set New API Key

### Step 1: Generate a Secure API Key

**Option A: Using OpenSSL (Recommended)**
```bash
openssl rand -base64 32
```

**Option B: Using PowerShell**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Option C: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 2: Set the API Key in Cloudflare

```bash
cd backend
echo "YOUR_NEW_API_KEY_HERE" | wrangler secret put API_KEY
```

### Step 3: Update Your Frontend Configuration

Open your dashboard and update the API key in Settings, or use localStorage:
```javascript
localStorage.setItem('fx_api_key', 'YOUR_NEW_API_KEY_HERE');
```

### Step 4: Update MT5 Expert Advisor

Edit the EA configuration in MetaTrader 5:
```mql5
input string API_KEY = "YOUR_NEW_API_KEY_HERE";
```

---

## 2. Generate and Set JWT Secret

The JWT secret is used to sign authentication tokens.

### Generate JWT Secret
```bash
openssl rand -base64 64
```

### Set JWT Secret
```bash
cd backend
echo "YOUR_JWT_SECRET_HERE" | wrangler secret put JWT_SECRET
```

---

## 3. Set Turnstile Secret Key (Optional)

If you're using Cloudflare Turnstile for bot protection:

1. Get your Turnstile secret key from: https://dash.cloudflare.com/turnstile
2. Set it:
```bash
cd backend
echo "YOUR_TURNSTILE_SECRET" | wrangler secret put TURNSTILE_SECRET_KEY
```

---

## 4. Change Default Admin Password

### Via API (Recommended)
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://fx-dashboard-api.ghwmelite.workers.dev/api/admin/users/1/reset-password \
  -d '{"newPassword": "YOUR_SECURE_PASSWORD_HERE"}'
```

### Via Dashboard
1. Login as admin (username: `admin`, password: `admin123`)
2. Navigate to Admin Portal > Users
3. Click "Reset Password" for the admin user
4. Enter a strong password (12+ characters, mixed case, numbers, symbols)

---

## 5. Verify All Secrets Are Set

```bash
cd backend
wrangler secret list
```

You should see:
- `API_KEY`
- `JWT_SECRET`
- `TURNSTILE_SECRET_KEY` (if using Turnstile)

---

## 6. Security Checklist

Before going to production, ensure:

- [ ] New API key generated and set
- [ ] JWT secret generated and set
- [ ] Default admin password changed
- [ ] API key removed from all documentation files
- [ ] `backend/api_key.txt` deleted
- [ ] `.gitignore` configured to exclude secrets
- [ ] CORS configured (not set to `*`)
- [ ] User data isolation implemented
- [ ] Rate limiting configured
- [ ] HTTPS enforced (automatic with Cloudflare)
- [ ] Database backups configured

---

## 7. Rotate Secrets Regularly

### Best Practices
- Rotate API keys every 90 days
- Rotate JWT secrets every 180 days
- Immediately rotate if compromised
- Keep a secure backup of current secrets before rotation

### Rotation Process
1. Generate new secret
2. Set new secret: `wrangler secret put SECRET_NAME`
3. Update all clients/integrations
4. Test thoroughly
5. Monitor for errors

---

## 8. Monitor for Security Issues

### Check Audit Logs
Regularly review audit logs in Admin Portal for:
- Failed login attempts
- Unauthorized access attempts
- Unusual user activity
- Bulk data exports

### Cloudflare Analytics
Monitor in Cloudflare Dashboard:
- Unusual traffic patterns
- Geographic anomalies
- High error rates
- DDoS attempts

---

## 9. Backup Strategy

### Database Backups
```bash
# Daily backup (automate this)
wrangler d1 export fx-trading-db --remote --output=backup_$(date +%Y%m%d).sql
```

### Backup Secrets (Encrypted)
Store secrets in a password manager like:
- 1Password
- LastPass
- Bitwarden
- Keeper

**NEVER** store secrets in:
- Git repositories
- Plaintext files
- Email
- Slack/Discord
- Documentation files

---

## 10. Incident Response Plan

### If API Key is Compromised:
1. Immediately rotate: `wrangler secret put API_KEY`
2. Review audit logs for unauthorized access
3. Check database for unauthorized modifications
4. Notify affected users if data breach occurred
5. Update all legitimate integrations with new key

### If Database is Compromised:
1. Immediately revoke all JWT tokens (rotate JWT_SECRET)
2. Force all users to reset passwords
3. Review audit logs
4. Restore from backup if necessary
5. Conduct security audit

---

## 📞 Security Resources

- **Cloudflare Security**: https://developers.cloudflare.com/fundamentals/security/
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Have I Been Pwned**: https://haveibeenpwned.com/ (check for breaches)

---

## ✅ Post-Setup Verification

After completing this guide:

1. Test login with new admin password ✓
2. Test API with new API key ✓
3. Verify JWT tokens are working ✓
4. Test MT5 webhook with new key ✓
5. Confirm secrets are not in Git ✓
6. Run security scan (if available) ✓

---

**Last Updated**: November 4, 2025
**Security Version**: 1.0.0
