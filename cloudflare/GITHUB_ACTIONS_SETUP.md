# GitHub Actions Setup for Cloudflare Worker

This repository is configured to automatically deploy the Cloudflare Worker when you push changes to the `cloudflare/worker/` directory.

## One-Time Setup

### Step 1: Create Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click **"Create Token"**
3. Use the **"Edit Cloudflare Workers"** template
4. Configure permissions:
   - **Account** → **Cloudflare Workers** → **Edit**
   - **Zone** → **Workers Routes** → **Edit**
5. Select your account: `Abhinavkoul12@gmail.com's Account`
6. Click **"Continue to summary"**
7. Click **"Create Token"**
8. **Copy the token** (you'll only see it once!)

### Step 2: Add Token to GitHub Secrets

1. Go to your GitHub repository: https://github.com/AbhinavKoul/house-rules-app
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add secret:
   - **Name:** `CLOUDFLARE_API_TOKEN`
   - **Secret:** Paste the API token from Step 1
5. Click **"Add secret"**

### Step 3: Test the Workflow

Push a change to the worker:

```bash
cd cloudflare/worker
# Make a small change to index.js (e.g., add a comment)
git add .
git commit -m "Test GitHub Actions deployment"
git push origin main
```

Watch the deployment:
1. Go to **Actions** tab in GitHub
2. You should see "Deploy Cloudflare Worker" running
3. Click on it to see live logs

## How It Works

```
┌─────────────────────────────────────────────┐
│  Push to main (changes in cloudflare/*)    │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │  GitHub Actions     │
         │  Workflow Triggered │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  Checkout Code      │
         │  Install Node.js    │
         │  Install Wrangler   │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  Deploy to          │
         │  Cloudflare         │
         │  (using API token)  │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  Worker Live!       │
         │  shreeganeshkunj.com│
         └─────────────────────┘
```

## Workflow Features

### Automatic Triggers
- ✅ Pushes to `main` branch
- ✅ Only when files in `cloudflare/worker/` change
- ✅ Can also trigger manually from Actions tab

### What It Does
1. Checks out your code
2. Sets up Node.js
3. Installs Wrangler CLI
4. Deploys worker using your API token
5. Shows deployment summary

## Manual Deployment (Alternative)

If you prefer to deploy manually:

```bash
cd cloudflare/worker
npm run deploy
```

## Viewing Deployments

### In GitHub
- Go to **Actions** tab
- Click on any workflow run
- View logs and deployment status

### In Cloudflare
- Go to [Workers Dashboard](https://dash.cloudflare.com)
- Click on `shreeganeshkunj-router`
- View deployment history and metrics

## Troubleshooting

### "Unauthorized" Error
- Check that `CLOUDFLARE_API_TOKEN` secret is set correctly
- Verify token has correct permissions
- Token may have expired - create a new one

### Worker Not Updating
- Check that files in `cloudflare/worker/` changed
- Workflow only runs on changes to that directory
- Can trigger manually: Actions → Deploy Cloudflare Worker → Run workflow

### Build Failed
- Check workflow logs in Actions tab
- Verify `wrangler.toml` syntax is correct
- Check `index.js` has no syntax errors

## Security Notes

🔒 **Important:**
- Never commit API tokens to git
- Always use GitHub Secrets for sensitive data
- API token has minimal permissions (only Workers edit)
- Rotate tokens periodically for security

## Benefits of GitHub Actions

✅ **Automatic Deployment**
- Push to main → Worker deploys automatically
- No manual `wrangler deploy` needed

✅ **Version Control**
- Every deployment is tracked
- Easy to rollback if needed
- See what changed in each deployment

✅ **Collaboration**
- Team members can deploy by pushing
- No need to share Cloudflare credentials
- All deployments logged in GitHub

✅ **CI/CD Pipeline**
- Can add tests before deployment
- Can deploy to staging first
- Can add notifications (Slack, email, etc.)

## Next Steps (Optional)

### Add Tests
Create `cloudflare/worker/test.js`:
```javascript
// Test your worker logic
```

Add to workflow:
```yaml
- name: Run tests
  run: npm test
```

### Deploy to Staging First
Create `wrangler.staging.toml` for testing environment

### Add Slack Notifications
Get notified when deployments succeed/fail

### Add Performance Monitoring
Track worker performance metrics
