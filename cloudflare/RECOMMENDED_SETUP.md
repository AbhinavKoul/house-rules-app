# Recommended Setup: Page Rules vs Worker

## TL;DR - Use Page Rules! 🎯

For your use case (redirect root to Airbnb, everything else to Heroku), **Page Rules are simpler and better**.

## Quick Comparison

| Aspect | Page Rules ✅ | Worker |
|--------|--------------|--------|
| **Setup Time** | 2 minutes | 30 minutes |
| **Complexity** | Click in dashboard | Write code + deploy |
| **Maintenance** | None | Code updates, CI/CD |
| **Limits** | Unlimited requests | 100k req/day (free) |
| **Perfect For** | Simple redirects | Complex logic |
| **Your Need** | ✅ Yes! | ❌ Overkill |

## What You Need

✅ **1 Page Rule:** Redirect `shreeganeshkunj.com/` → Airbnb
✅ **DNS:** CNAME to Heroku (already done)
✅ **That's it!**

## Setup: Choose Your Path

### Path A: Page Rules (Recommended) ⭐

**Time:** 2 minutes
**Skill:** Point and click

**Steps:**
1. Go to Cloudflare Dashboard → **Rules** → **Page Rules**
2. Create rule:
   - URL: `shreeganeshkunj.com/`
   - Setting: **Forwarding URL** (302)
   - Destination: `https://airbnb.com/h/shreeganeshkunj`
3. Save

**See:** `PAGE_RULES_SETUP.md` for detailed guide

### Path B: Worker (Over-engineered)

**Time:** 30+ minutes  
**Skill:** Code + deployment

**Steps:**
1. Write JavaScript routing logic
2. Configure wrangler
3. Deploy worker
4. Set up GitHub Actions
5. Create API tokens
6. Maintain code

**See:** `cloudflare/worker/` directory

## Current Status

You have **both** set up! Here's what to do:

### Recommended: Switch to Page Rules

**Why:**
- Simpler
- No code to maintain
- No deployment needed
- Unlimited requests

**How:**
1. Follow `PAGE_RULES_SETUP.md` (2 minutes)
2. Optionally delete worker to keep things clean

### Alternative: Keep Worker

**If:**
- You plan to add complex routing later
- You want to learn Workers
- You might need A/B testing, analytics, etc.

**Note:** Page Rules have priority over Workers, so adding a Page Rule won't break the worker.

## What Happens With Each

### Page Rules Flow
```
Request: shreeganeshkunj.com
    ↓
Cloudflare checks Page Rules
    ↓
Matches "shreeganeshkunj.com/" ?
    ↓                    ↓
   Yes                  No
    ↓                    ↓
Redirect to          Pass to
Airbnb              Heroku (via DNS)
```

### Worker Flow  
```
Request: shreeganeshkunj.com
    ↓
Cloudflare runs Worker JavaScript
    ↓
Worker checks path
    ↓                    ↓
Path === "/"        Other paths
    ↓                    ↓
Redirect to         Proxy to
Airbnb             Heroku
```

Both achieve the same result, but Page Rules are simpler!

## Cost Comparison

| Item | Page Rules | Worker |
|------|-----------|--------|
| Setup | Free | Free |
| Requests | Unlimited | 100k/day |
| CPU Time | N/A | Limited |
| Memory | N/A | 128MB |
| Maintenance | Free | Your time |

## When You'd Need a Worker

Workers are powerful for:

✅ **A/B Testing**
```javascript
if (Math.random() < 0.5) {
  return Response.redirect(urlA);
} else {
  return Response.redirect(urlB);
}
```

✅ **Custom Analytics**
```javascript
await fetch('https://analytics.example.com', {
  method: 'POST',
  body: JSON.stringify({ url, timestamp, userAgent })
});
```

✅ **Geo-based Routing**
```javascript
const country = request.cf.country;
if (country === 'US') return usVersion;
```

✅ **API Transformations**
```javascript
const data = await fetch(backend);
return new Response(
  JSON.stringify(transform(data)),
  { headers: { 'Content-Type': 'application/json' }}
);
```

✅ **Authentication**
```javascript
const token = request.headers.get('Authorization');
if (!validateToken(token)) {
  return new Response('Unauthorized', { status: 401 });
}
```

**Your use case:** Simple redirect → **Page Rules!**

## My Recommendation 🎯

1. **Add Page Rule** (follow PAGE_RULES_SETUP.md)
2. **Test it works**
3. **Delete Worker** (optional cleanup)
4. **Remove GitHub Actions workflow** (not needed)
5. **Enjoy simplicity!**

You'll have:
- ✅ Clean, maintainable setup
- ✅ No code to maintain
- ✅ No deployment pipeline
- ✅ Same functionality
- ✅ Unlimited requests

## Making the Change

### If you want to switch to Page Rules:

```bash
# 1. Create Page Rule in Cloudflare Dashboard
#    (follow PAGE_RULES_SETUP.md)

# 2. Delete worker files (optional)
git rm -r cloudflare/worker/
git rm .github/workflows/deploy-worker.yml
git commit -m "Switch to Page Rules (simpler than Worker)"
git push

# 3. Delete worker from Cloudflare (optional)
#    Dashboard → Workers → shreeganeshkunj-router → Delete
```

### If you want to keep Worker:

```bash
# Just add Page Rule in dashboard
# Worker will be a backup (Page Rules have priority)
```

## Questions?

**Q: Can I have both?**
A: Yes! Page Rules run first. Worker is backup.

**Q: What if I need complex logic later?**
A: Easy! Delete Page Rule, activate Worker. Or add logic to Worker and remove Page Rule.

**Q: Will old Heroku URL still work?**
A: Yes! With either approach, backwards compatibility maintained.

**Q: Which is faster?**
A: Page Rules are slightly faster (no code execution), but difference is negligible.

**Q: Which is more reliable?**
A: Both are equally reliable. Cloudflare's infrastructure is rock solid.

## Bottom Line

For redirecting root → Airbnb while sending /house-rules, /admin, /analytics → Heroku:

**Page Rules = Perfect tool for the job** ✅

**Worker = Sledgehammer to crack a nut** 🔨🥜

Choose simplicity! Use Page Rules! 🎉
