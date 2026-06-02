# Shree Ganesh Kunj - Cloudflare Worker

This Cloudflare Worker handles routing for `shreeganeshkunj.com`:
- Root (`/`) → Redirects to Airbnb listing
- All other paths → Proxies to Heroku app

## Local Development

### Install dependencies
```bash
npm install
```

### Test locally
```bash
npm run dev
```

### View logs
```bash
npm run tail
```

## Deployment

### Manual Deployment
```bash
npm run deploy
```

### Automatic Deployment
Push to `main` branch and GitHub Actions will automatically deploy the worker.

## Configuration

Edit `wrangler.toml` to change:
- Worker name
- Routes
- Environment variables

Edit `index.js` to change:
- Routing logic
- Redirect URLs
- Proxy behavior

## How It Works

```javascript
Request comes in
    ↓
Path === "/" ?
    ↓        ↓
   Yes       No
    ↓        ↓
Redirect   Proxy to
to Airbnb   Heroku
```

## URLs

- **Production:** `https://shreeganeshkunj.com/*`
- **Heroku Backend:** `https://house-rules-acknowledgment-91bc2e7022ee.herokuapp.com`
- **Airbnb Listing:** `https://airbnb.com/h/shreeganeshkunj`

## Monitoring

View real-time logs:
```bash
wrangler tail
```

Check deployment status in [Cloudflare Dashboard](https://dash.cloudflare.com)
