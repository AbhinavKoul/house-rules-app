# HTTPS Enforcement Guide

## TL;DR - Enable "Always Use HTTPS"

**Time:** 30 seconds
**Location:** Cloudflare Dashboard → SSL/TLS → Edge Certificates

## Method 1: Always Use HTTPS (Recommended) ⭐

### Setup

1. Go to: https://dash.cloudflare.com
2. Select: **shreeganeshkunj.com**
3. Navigate: **SSL/TLS** → **Edge Certificates**
4. Find: **"Always Use HTTPS"**
5. Toggle: **ON**

### What This Does

✅ **All HTTP traffic** automatically redirects to HTTPS
✅ **Applies to entire domain** (root and all paths)
✅ **301 redirect** (permanent - good for SEO)
✅ **Zero configuration** needed

### Result

```
Before:
http://shreeganeshkunj.com → Works but insecure ❌
https://shreeganeshkunj.com → Secure ✅

After:
http://shreeganeshkunj.com → 301 → https://shreeganeshkunj.com ✅
https://shreeganeshkunj.com → Secure ✅
```

## Method 2: HSTS (Extra Security) 🔒

**HSTS** = HTTP Strict Transport Security

Makes browsers **remember** to always use HTTPS.

### Setup

1. Go to: **SSL/TLS** → **Edge Certificates**
2. Find: **"HTTP Strict Transport Security (HSTS)"**
3. Click: **"Enable HSTS"**
4. Configure:
   - **Status:** Enabled
   - **Max Age:** 6 months (recommended)
   - **Include Subdomains:** ON (if you use www)
   - **Preload:** OFF (enable later if needed)
5. **Accept the warning** (read it carefully)
6. Save

### What This Does

✅ Browser **remembers** to use HTTPS
✅ **Faster** (no redirect needed after first visit)
✅ **More secure** (prevents downgrade attacks)
✅ **Industry best practice**

### Warning ⚠️

Once enabled, you **can't turn it off** immediately!
- Max-Age means browsers will enforce HTTPS for that duration
- Start with 1 month, increase to 6 months later
- Only enable once you're **sure** HTTPS works everywhere

## Method 3: Page Rule (Per-URL Control)

If you only want HTTPS on specific pages:

### Setup

1. Go to: **Rules** → **Page Rules**
2. Create rule:
   - URL: `http://shreeganeshkunj.com/*`
   - Setting: **Always Use HTTPS**
   - Status: Active
3. Save

### When to Use This

- You want different behavior for different paths
- You're migrating gradually
- You have mixed content issues on some pages

**For your site:** Not needed - Method 1 is simpler!

## SSL/TLS Encryption Mode

Make sure your SSL/TLS mode is correct:

### Check Current Setting

1. Go to: **SSL/TLS** → **Overview**
2. Check: **Your SSL/TLS encryption mode**

### Recommended: Full (Strict) 🔒

```
User → [HTTPS] → Cloudflare → [HTTPS] → Heroku
       ✅                        ✅
```

**Set to:** **Full (strict)**

This ensures:
- ✅ User to Cloudflare = HTTPS
- ✅ Cloudflare to Heroku = HTTPS (verified certificate)
- ✅ End-to-end encryption

### Why Not Other Modes?

| Mode | User→CF | CF→Heroku | Secure? |
|------|---------|-----------|---------|
| Off | HTTP | HTTP | ❌ No |
| Flexible | HTTPS | HTTP | ⚠️ Partial |
| Full | HTTPS | HTTPS | ⚠️ Not verified |
| **Full (strict)** | HTTPS | HTTPS ✅ | ✅ **Yes** |

## Complete Security Checklist

### Basic (Do These Now)

- [ ] **Always Use HTTPS** → ON
- [ ] **SSL/TLS mode** → Full (strict)
- [ ] **Minimum TLS Version** → TLS 1.2 or higher
- [ ] **Automatic HTTPS Rewrites** → ON

### Advanced (Do These Later)

- [ ] **HSTS** → ON (after testing)
- [ ] **TLS 1.3** → ON
- [ ] **0-RTT Connection Resumption** → ON
- [ ] **Opportunistic Encryption** → ON

## Testing HTTPS Enforcement

### Test 1: HTTP Redirect

```bash
curl -I http://shreeganeshkunj.com
```

Should show:
```
HTTP/1.1 301 Moved Permanently
Location: https://shreeganeshkunj.com/
```

### Test 2: HTTPS Works

```bash
curl -I https://shreeganeshkunj.com
```

Should show:
```
HTTP/2 200
```

### Test 3: Browser Test

1. Visit: `http://shreeganeshkunj.com` (no https)
2. Should auto-redirect to: `https://shreeganeshkunj.com`
3. Check browser address bar shows: 🔒 Secure

### Test 4: SSL Labs Test

For thorough security check:
1. Go to: https://www.ssllabs.com/ssltest/
2. Enter: `shreeganeshkunj.com`
3. Click: **Submit**
4. Target Grade: **A** or **A+**

## Automatic HTTPS Rewrites

Fixes mixed content issues automatically.

### Setup

1. Go to: **SSL/TLS** → **Edge Certificates**
2. Find: **"Automatic HTTPS Rewrites"**
3. Toggle: **ON**

### What This Does

If your page loads:
```html
<script src="http://example.com/script.js"></script>
```

Cloudflare automatically rewrites to:
```html
<script src="https://example.com/script.js"></script>
```

Prevents "Mixed Content" warnings in browser! ✅

## Troubleshooting

### "Too Many Redirects" Error

**Cause:** SSL/TLS mode mismatch

**Fix:**
1. Cloudflare → **SSL/TLS** → **Full (strict)**
2. Heroku → Check ACM SSL is provisioned
3. Clear browser cache

### Certificate Not Valid

**Wait 15-30 minutes** for:
- Cloudflare Universal SSL (automatic)
- Heroku ACM SSL (automatic)

Check status:
```bash
heroku certs -a house-rules-acknowledgment
```

### Mixed Content Warnings

**Enable:** Automatic HTTPS Rewrites (see above)

Or manually fix:
- Change `http://` to `https://` in your HTML/CSS
- Use protocol-relative URLs: `//example.com/file.js`

## Summary - Quick Setup

**5-Minute Security Boost:**

1. ✅ **Always Use HTTPS** → ON
2. ✅ **SSL/TLS Mode** → Full (strict)
3. ✅ **Automatic HTTPS Rewrites** → ON
4. ✅ **Minimum TLS Version** → 1.2
5. 🔜 **HSTS** → Enable after testing (1-2 weeks)

**Result:**
- All traffic encrypted end-to-end
- Automatic HTTP → HTTPS redirect
- Better SEO ranking
- Browser security badge 🔒

## Why This Matters

### Security
- ✅ Encrypts data in transit
- ✅ Prevents man-in-the-middle attacks
- ✅ Protects sensitive form data (guest info, admin login)

### SEO
- ✅ Google ranks HTTPS sites higher
- ✅ Better trust signals
- ✅ Required for modern web features

### User Trust
- ✅ Browser shows 🔒 padlock
- ✅ No "Not Secure" warnings
- ✅ Professional appearance

### Compliance
- ✅ Required for payment processing
- ✅ Privacy regulation compliance (GDPR, etc.)
- ✅ Industry best practice

## Cost

**Everything is FREE!** ✅

- Cloudflare Universal SSL: Free
- Heroku ACM SSL: Free
- Always Use HTTPS: Free
- HSTS: Free

No paid upgrades needed for SSL/HTTPS! 🎉
