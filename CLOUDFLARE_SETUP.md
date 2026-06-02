# Cloudflare Setup Guide for shreeganeshkunj.com

## Overview
This guide sets up routing for your domain:
- **Root (`shreeganeshkunj.com`)** → Redirects to Airbnb listing
- **`/house-rules`** → Your booking form
- **`/admin`** → Admin panel  
- **`/analytics`** → Analytics dashboard
- **Old Heroku URL** → Still works (backwards compatible)

## Prerequisites
- ✅ Domain: `shreeganeshkunj.com` registered in Cloudflare
- ✅ Heroku app: `house-rules-acknowledgment-91bc2e7022ee.herokuapp.com`
- ✅ Cloudflare account authenticated

## Step 1: Install Wrangler (Cloudflare CLI)

```bash
npm install -g wrangler
```

## Step 2: Login to Wrangler

```bash
wrangler login
```

This will open a browser window to authenticate.

## Step 3: Deploy the Worker

From your project directory:

```bash
wrangler deploy
```

This will:
1. Deploy `cloudflare-worker.js` to Cloudflare
2. Create a Worker named `shreeganeshkunj-router`
3. Attach it to your domain routes

## Step 4: Configure DNS in Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain: `shreeganeshkunj.com`
3. Go to **DNS** section
4. Add an A record (if not exists):
   ```
   Type: A
   Name: @ (root)
   IPv4: 192.0.2.1 (dummy IP, Worker will intercept)
   Proxy: ON (orange cloud)
   ```
5. Add a CNAME for www (optional):
   ```
   Type: CNAME
   Name: www
   Target: shreeganeshkunj.com
   Proxy: ON (orange cloud)
   ```

## Step 5: Configure Worker Route (if not auto-configured)

1. In Cloudflare Dashboard → **Workers & Pages**
2. Select your worker: `shreeganeshkunj-router`
3. Go to **Settings** → **Triggers** → **Routes**
4. Add route: `shreeganeshkunj.com/*`
5. Select zone: `shreeganeshkunj.com`
6. Save

## Step 6: Update Heroku Configuration (Optional but Recommended)

Tell Heroku about your custom domain:

```bash
heroku domains:add shreeganeshkunj.com -a house-rules-acknowledgment
heroku domains:add www.shreeganeshkunj.com -a house-rules-acknowledgment
```

## Testing

After deployment, test these URLs:

1. **Root redirect:**
   ```
   https://shreeganeshkunj.com
   → Should redirect to: https://airbnb.com/h/shreeganeshkunj
   ```

2. **House Rules form:**
   ```
   https://shreeganeshkunj.com/house-rules
   → Should show your booking form
   ```

3. **Admin panel:**
   ```
   https://shreeganeshkunj.com/admin
   → Should show admin dashboard
   ```

4. **Analytics:**
   ```
   https://shreeganeshkunj.com/analytics
   → Should show analytics dashboard
   ```

5. **Backwards compatibility:**
   ```
   https://house-rules-acknowledgment-91bc2e7022ee.herokuapp.com
   → Should still work
   ```

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    User Request                          │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │  shreeganeshkunj.com   │
           │   (Cloudflare DNS)     │
           └────────────┬───────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │   Cloudflare Worker    │
           │  (Routing Logic)       │
           └────────────┬───────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
         ▼                             ▼
┌─────────────────┐         ┌──────────────────┐
│ Path: /         │         │ All other paths  │
│ Action: Redirect│         │ Action: Proxy    │
│ To: Airbnb      │         │ To: Heroku       │
└─────────────────┘         └──────────────────┘
```

## Troubleshooting

### Worker not triggering
- Check that DNS records have **orange cloud** (proxied) enabled
- Verify worker route is correctly configured
- Check worker logs: `wrangler tail`

### Redirect loop
- Make sure Heroku app doesn't have its own redirect to custom domain
- Check that X-Forwarded-Host header is properly set

### SSL/HTTPS issues
- Cloudflare handles SSL automatically
- Make sure "Always Use HTTPS" is enabled in Cloudflare SSL settings

## Updating the Worker

To make changes:

1. Edit `cloudflare-worker.js`
2. Run: `wrangler deploy`
3. Changes are live immediately

## View Worker Logs

```bash
wrangler tail
```

This shows real-time logs of requests hitting your Worker.

## Cost

- Cloudflare Workers Free Tier: **100,000 requests/day**
- Should be more than enough for your use case
- No additional cost beyond domain registration

## Alternative Approach: Redirect Rules Only

If you prefer NOT to use a Worker, you can use Cloudflare Page Rules instead:

1. Create a Page Rule for root redirect:
   - URL: `shreeganeshkunj.com/`
   - Setting: Forwarding URL (302)
   - Destination: `https://airbnb.com/h/shreeganeshkunj`

2. Create a CNAME record pointing to Heroku:
   - Type: CNAME
   - Name: @ 
   - Target: `house-rules-acknowledgment-91bc2e7022ee.herokuapp.com`

**Note:** This approach is simpler but less flexible than the Worker approach.
