# Root URL Redirect Options

Based on your request: "I want shreeganeshkunj.com to automatically point to shreeganeshkunj.com/house-rules"

## Option 1: Redirect Root to /house-rules (Recommended) ⭐

### What It Does
```
User types: shreeganeshkunj.com
Browser shows: shreeganeshkunj.com/house-rules
```

### Setup - Page Rule

1. Go to: **Rules** → **Page Rules**
2. Create Rule:
   - **URL:** `shreeganeshkunj.com/`
   - **Setting:** Forwarding URL
   - **Status Code:** 301 (Permanent Redirect)
   - **Destination:** `https://shreeganeshkunj.com/house-rules`
3. Save

### Result
- ✅ `shreeganeshkunj.com` → Redirects to `/house-rules`
- ✅ URL in browser changes to show `/house-rules`
- ✅ Good for SEO (canonical URL)
- ✅ Users see clean, clear URL

## Option 2: Root Serves Form Directly (No Redirect)

### What It Does
```
User types: shreeganeshkunj.com
Browser shows: shreeganeshkunj.com (stays at root)
Content shown: House rules form
```

### Setup - Server Configuration

No Page Rule needed! Just update `server.js`:

```javascript
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
```

(This is already your current setup!)

### Result
- ✅ Root directly shows the form
- ✅ No redirect needed
- ✅ Simpler
- ❌ URL stays as just `.com` (less clear)

## Option 3: Root with Path in URL Bar

### What It Does
```
User types: shreeganeshkunj.com
Browser shows: shreeganeshkunj.com/house-rules (via URL rewrite)
Content shown: House rules form
```

### Setup - Cloudflare Transform Rule

This is more complex and requires Cloudflare's Transform Rules (Pro plan) or server-side handling.

**Not recommended** - Option 1 or 2 are better!

## Recommended for Your Use Case

### Best Choice: Option 1 (Redirect to /house-rules) ⭐

**Why:**
- ✅ Clear URL tells users where they are
- ✅ Easy to share the link
- ✅ Good for bookmarking
- ✅ SEO friendly
- ✅ Users can see they're on "house-rules" page

### Alternative: No Redirect (Keep Current Setup)

**Why:**
- ✅ Simpler (no Page Rule needed)
- ✅ Already works
- ✅ Root shows the form

**Downside:**
- URL just shows `shreeganeshkunj.com` 
- Less clear what page user is on

## What About Airbnb?

If you want root to go to house rules, where do you want the Airbnb link?

### Option A: Don't redirect to Airbnb automatically
- Just have link on the page: "View our listing"
- Link goes to Airbnb

### Option B: Use a subdomain
- `listing.shreeganeshkunj.com` → Airbnb
- Requires additional DNS record + Page Rule

### Option C: Use a path
- `shreeganeshkunj.com/listing` → Airbnb
- Requires one Page Rule

## My Recommendation 🎯

**Simplest Setup:**

1. **Root:** Show house rules form directly (current setup - no changes)
2. **No redirect needed** - form is at root already
3. **Airbnb:** Add a prominent link on the page

**OR**

1. **Page Rule:** Root redirects to `/house-rules`
2. **Clear URL:** Users see they're on house rules page
3. **Airbnb:** Add link in header/footer

## Implementation

### For Redirect (Option 1):

**Cloudflare Dashboard:**
```
Rules → Page Rules → Create

URL pattern: shreeganeshkunj.com/
Setting: Forwarding URL (301)
Destination: https://shreeganeshkunj.com/house-rules
```

### For No Redirect (Option 2):

**Already working!** Your `server.js` already does this:
```javascript
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
```

## Testing

### After Setting Up Option 1:
```bash
curl -I https://shreeganeshkunj.com
```
Should show:
```
HTTP/2 301
location: https://shreeganeshkunj.com/house-rules
```

### Current Setup (Option 2):
```bash
curl https://shreeganeshkunj.com
```
Should show: HTML of your house rules form

## Summary

**Question:** "I want shreeganeshkunj.com to point to shreeganeshkunj.com/house-rules"

**Answer:** Two interpretations:

1. **Redirect** (URL changes) → Add Page Rule
2. **Serve form at root** (URL stays same) → Already works!

**Which do you prefer?**
