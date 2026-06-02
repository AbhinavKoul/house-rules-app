# Final Setup Guide - Complete Configuration

## Your Requirements ✅

- ✅ `shreeganeshkunj.com` → Redirect to Airbnb listing
- ✅ `shreeganeshkunj.com/house-rules` → House rules form
- ✅ `shreeganeshkunj.com/admin` → Admin panel
- ✅ `shreeganeshkunj.com/analytics` → Analytics dashboard
- ✅ Old Heroku URL → Still works (backwards compatible)
- ✅ All traffic uses HTTPS

## Step-by-Step Setup

### Step 1: Fix DNS Warning (If Showing)

**Where:** Cloudflare Dashboard

**What to check:**
1. Go to: https://dash.cloudflare.com
2. Select: **shreeganeshkunj.com**
3. Look for warning banner at top

**If you see "Incorrect DNS settings":**
- Note the nameservers shown (e.g., `audrey.ns.cloudflare.com`, `keanu.ns.cloudflare.com`)
- Go to where you **registered** the domain (registrar)
- Update nameservers to match Cloudflare's
- Wait 10-30 minutes

**Current Status:** Zone is **ACTIVE** ✅ (should be working)

### Step 2: Create Page Rule for Root → Airbnb

**Location:** Rules → Page Rules

**Configuration:**
```
URL: shreeganeshkunj.com/
     (Important: include the trailing slash!)

Setting: Forwarding URL
Status Code: 302 - Temporary Redirect
Destination URL: https://airbnb.com/h/shreeganeshkunj

Priority: 1
Status: Active
```

**Why 302 (Temporary)?**
- You might want to change it later
- More flexible than 301 (permanent)

**Steps:**
1. Go to Cloudflare Dashboard
2. Select: **shreeganeshkunj.com**
3. Go to: **Rules** → **Page Rules**
4. Click: **Create Page Rule**
5. Enter URL: `shreeganeshkunj.com/`
6. Click: **Add a Setting** → **Forwarding URL**
7. Select: **302 - Temporary Redirect**
8. Enter destination: `https://airbnb.com/h/shreeganeshkunj`
9. Click: **Save and Deploy**

### Step 3: Enable HTTPS Enforcement

**Location:** SSL/TLS → Edge Certificates

**Settings to enable:**
1. **Always Use HTTPS:** ON
2. **SSL/TLS encryption mode:** Full (strict)
3. **Automatic HTTPS Rewrites:** ON
4. **Minimum TLS Version:** TLS 1.2

**Steps:**
1. Go to: **SSL/TLS** → **Overview**
2. Set encryption mode: **Full (strict)**
3. Go to: **SSL/TLS** → **Edge Certificates**
4. Toggle **Always Use HTTPS:** ON
5. Toggle **Automatic HTTPS Rewrites:** ON
6. Set **Minimum TLS Version:** 1.2 or higher

### Step 4: Verify DNS Records

**Location:** DNS → Records

**Should show:**
```
Type: CNAME
Name: @ (shreeganeshkunj.com)
Target: silhouetted-bat-0dgzq8um36vxh6eit6g58jkd.herokudns.com
Proxy status: Proxied (orange cloud)
```

```
Type: CNAME
Name: www
Target: experimental-frog-ru66xgvkuwzg7trq3xtlf6mp.herokudns.com
Proxy status: Proxied (orange cloud)
```

**If missing:** Already configured! ✅

## Testing Your Setup

### Test 1: Root redirects to Airbnb
```bash
curl -I https://shreeganeshkunj.com
```

Expected output:
```
HTTP/2 302
location: https://airbnb.com/h/shreeganeshkunj
```

### Test 2: House rules works
```bash
curl -I https://shreeganeshkunj.com/house-rules
```

Expected output:
```
HTTP/2 200
```

### Test 3: Admin works
```bash
curl -I https://shreeganeshkunj.com/admin
```

Expected output:
```
HTTP/2 200
```

### Test 4: Analytics works
```bash
curl -I https://shreeganeshkunj.com/analytics
```

Expected output:
```
HTTP/2 200
```

### Test 5: HTTPS redirect works
```bash
curl -I http://shreeganeshkunj.com/house-rules
```

Expected output:
```
HTTP/1.1 301 Moved Permanently
location: https://shreeganeshkunj.com/house-rules
```

### Test 6: Old URL still works
```bash
curl -I https://house-rules-acknowledgment-91bc2e7022ee.herokuapp.com
```

Expected output:
```
HTTP/2 200
```

## Complete Flow Diagram

```
User Request
     │
     ▼
Is HTTPS?
     │
    No → Redirect to HTTPS ✅
     │
    Yes
     │
     ▼
Cloudflare DNS (CNAME → Heroku)
     │
     ▼
Check Page Rules
     │
     ├─→ Path = "/" ?
     │        │
     │       Yes → Redirect to Airbnb ✅
     │        │
     │       No
     │        │
     │        ▼
     └─→ Pass to Heroku
              │
              ▼
         Express Server
              │
              ├─→ /house-rules → index.html ✅
              ├─→ /admin → admin.html ✅
              └─→ /analytics → analytics.html ✅
```

## URL Summary

After complete setup:

| URL | Destination | Purpose |
|-----|------------|---------|
| `shreeganeshkunj.com` | Airbnb | Your listing |
| `shreeganeshkunj.com/house-rules` | Heroku app | Guest form |
| `shreeganeshkunj.com/admin` | Heroku app | Admin panel |
| `shreeganeshkunj.com/analytics` | Heroku app | Analytics |
| `www.shreeganeshkunj.com/*` | Heroku app | WWW variant |
| Old Heroku URL | Heroku app | Backwards compatible ✅ |

## Sharing Links

### For Airbnb Guests (House Rules)
Share this: **https://shreeganeshkunj.com/house-rules**

Add this to your:
- Airbnb listing description
- Welcome message
- House manual
- QR code at property

### For Property Listing
Your main site: **https://shreeganeshkunj.com**
(Redirects to Airbnb)

### For Admin Access
Keep private: **https://shreeganeshkunj.com/admin**
(Requires host key)

## Troubleshooting

### "Incorrect DNS Settings" Warning

**Possible causes:**

1. **Nameservers not updated at registrar**
   - Check where you bought the domain
   - Update to Cloudflare's nameservers
   - Wait 10-30 minutes

2. **Recent change still propagating**
   - DNS can take up to 48 hours (usually < 1 hour)
   - Check: https://dnschecker.org/#CNAME/shreeganeshkunj.com

3. **DNSSEC enabled at registrar**
   - If you have DNSSEC enabled at your registrar
   - You need to add DS records from Cloudflare
   - Or disable DNSSEC temporarily

### Page Rule Not Working

**Check these:**
- [ ] URL pattern is exactly: `shreeganeshkunj.com/` (with trailing slash)
- [ ] Status is: Active (not Paused)
- [ ] Priority is: 1 (higher number = higher priority)
- [ ] Destination is correct: `https://airbnb.com/h/shreeganeshkunj`

### All Paths Redirect to Airbnb

**Problem:** Page Rule pattern too broad

**Wrong:**
```
shreeganeshkunj.com/*    ← Matches everything!
```

**Correct:**
```
shreeganeshkunj.com/     ← Only matches root
```

### HTTPS Not Working

**Check:**
1. SSL/TLS mode: **Full (strict)**
2. Always Use HTTPS: **ON**
3. Wait 15-30 minutes for SSL cert provisioning

### 404 on Subpaths

**Check `server.js`:**
```javascript
// Make sure you have:
app.use(express.static('public'));

// Or explicit routes:
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
```

## Complete Checklist

### Cloudflare Setup
- [ ] Nameservers updated (if needed)
- [ ] DNS: CNAME @ → Heroku (proxied)
- [ ] DNS: CNAME www → Heroku (proxied)
- [ ] Page Rule: Root → Airbnb redirect
- [ ] Always Use HTTPS: ON
- [ ] SSL/TLS mode: Full (strict)
- [ ] Automatic HTTPS Rewrites: ON

### Heroku Setup
- [x] Custom domain: shreeganeshkunj.com ✅
- [x] Custom domain: www.shreeganeshkunj.com ✅
- [x] SSL provisioned ✅
- [x] App deployed ✅

### Files
- [x] public/index.html (house rules) ✅
- [x] public/admin.html ✅
- [x] public/analytics.html ✅
- [x] server.js configured ✅

## Timeline

- **Nameserver update:** 10-30 minutes (if needed)
- **DNS propagation:** 5-10 minutes
- **SSL certificate:** 15-30 minutes (automatic)
- **Page Rule:** Immediate
- **Total:** ~30-60 minutes for everything

## Support

- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **DNS Checker:** https://dnschecker.org
- **SSL Test:** https://www.ssllabs.com/ssltest/

## What's Next?

Once everything is working:

1. ✅ Test all URLs
2. ✅ Update Airbnb listing with house rules link
3. ✅ Create QR code for `/house-rules`
4. ✅ Update bookmarks/shortcuts
5. ✅ Announce new URL to guests

## Status Check

Run these to verify:

```bash
# Check DNS
dig shreeganeshkunj.com +short

# Check nameservers
dig shreeganeshkunj.com NS +short

# Test root redirect
curl -I https://shreeganeshkunj.com

# Test house rules
curl -I https://shreeganeshkunj.com/house-rules
```

All set! 🎉
