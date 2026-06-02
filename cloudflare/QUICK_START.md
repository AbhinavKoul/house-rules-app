# Quick Start - GitHub Actions Setup

## ⚡ 5-Minute Setup

### Step 1: Create Cloudflare API Token

**Option A: Use the Direct Link (Fastest)**

Click this link: [Create Workers API Token](https://dash.cloudflare.com/profile/api-tokens/create?permissions=workers_scripts:edit,workers_routes:edit&name=GitHub%20Actions%20-%20House%20Rules%20Worker)

This pre-fills the correct permissions for you!

**Option B: Manual Setup**

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"**
3. Use template: **"Edit Cloudflare Workers"**
4. Click **"Continue to summary"** → **"Create Token"**
5. **Copy the token** (shown only once!)

### Step 2: Add Token to GitHub

1. Go to: https://github.com/AbhinavKoul/house-rules-app/settings/secrets/actions
2. Click **"New repository secret"**
3. Enter:
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: [paste your token]
4. Click **"Add secret"**

### Step 3: Test Deployment

The workflow will automatically run when you push changes to `cloudflare/worker/`.

To test it now:

```bash
cd cloudflare/worker
echo "// Trigger deployment" >> index.js
git add .
git commit -m "Test GitHub Actions deployment"
git push origin main
```

Then watch: https://github.com/AbhinavKoul/house-rules-app/actions

## ✅ Verification

Once the token is added:

1. Go to **Actions** tab in GitHub
2. Click **"Deploy Cloudflare Worker"**
3. Click **"Run workflow"** → **"Run workflow"**
4. Watch it deploy!

## 🎉 That's It!

From now on, any push to `main` that changes files in `cloudflare/worker/` will automatically deploy your worker.

## Common Commands

### Deploy Manually (Alternative)
```bash
cd cloudflare/worker
npm install
npm run deploy
```

### Test Locally
```bash
cd cloudflare/worker
npm run dev
# Visit http://localhost:8787
```

### View Live Logs
```bash
cd cloudflare/worker
npm run tail
```

## Need Help?

- **Full Setup Guide**: See `GITHUB_ACTIONS_SETUP.md`
- **Worker Documentation**: See `worker/README.md`
- **Cloudflare Docs**: https://developers.cloudflare.com/workers/

## Security Note

🔒 The API token is stored securely in GitHub Secrets and never exposed in logs or code.
