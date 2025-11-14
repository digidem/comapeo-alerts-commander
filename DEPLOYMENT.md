# Deployment Guide

This guide provides step-by-step instructions for deploying Geo Alert Commander to Cloudflare Pages using GitHub Actions.

## Overview

The project uses automated GitHub Actions workflows for deployment:

1. **Production Deployment** - Deploys to production on every push to `main`
2. **PR Preview Deployment** - Creates preview deployments for pull requests at `https://pr-{number}.geo-alert-commander.pages.dev`

## Initial Setup

### 1. Create Cloudflare Pages Project

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages**
3. Click **Create application** > **Pages**
4. Name your project: `geo-alert-commander`

**Note:** You don't need to connect GitHub in Cloudflare - our GitHub Actions handle deployments via API.

### 2. Get Cloudflare Credentials

#### Account ID
1. In Cloudflare Dashboard, go to **Workers & Pages**
2. Your Account ID is displayed in the right sidebar
3. Or navigate to any Pages project > **Settings** - Account ID is under "Production"

#### API Token
1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use the **Edit Cloudflare Workers** template, OR create a custom token with:
   - **Account** > **Cloudflare Pages** > **Edit**
4. Select your account under **Account Resources**
5. Click **Continue to summary** > **Create Token**
6. **Copy the token immediately** - you won't see it again!

### 3. Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add these two secrets:

```
CLOUDFLARE_API_TOKEN = <your API token from step 2>
CLOUDFLARE_ACCOUNT_ID = <your account ID from step 2>
```

### 4. Configure Environment Variables (Optional)

To use Mapbox in production:

1. Go to Cloudflare Dashboard > Your Pages project
2. Navigate to **Settings** > **Environment variables**
3. Click **Add variables**
4. Add:
   - **Variable name:** `VITE_MAPBOX_TOKEN`
   - **Value:** Your Mapbox token
   - **Environment:** Production (and/or Preview)
5. Click **Save**

**Important:** Environment variables are baked into the build, not loaded at runtime. Redeploy after changing them.

## Deployment Workflows

### Production Deployment

**Triggers:**
- Automatically on push to `main` branch
- Manually via GitHub Actions UI (workflow_dispatch)

**What it does:**
1. Checks out code
2. Installs dependencies with `npm ci`
3. Builds the app with `npm run build`
4. Deploys `dist/` to Cloudflare Pages
5. Generates deployment summary

**Deployment URL:** `https://geo-alert-commander.pages.dev`

### PR Preview Deployment

**Triggers:**
- Automatically when PR is opened, updated, or reopened
- **Skipped** for PRs from forks (security protection)
- **Skipped** for PRs that only modify `.md` or `docs/` files

**What it does:**
1. Security check (blocks forks)
2. Builds PR code
3. Deploys to unique branch: `pr-{number}`
4. Posts/updates comment on PR with preview URL
5. Cancels previous deployments for the same PR

**Preview URL:** `https://pr-{number}.geo-alert-commander.pages.dev`

**Example:** PR #42 → `https://pr-42.geo-alert-commander.pages.dev`

## Manual Deployment

### Via GitHub Actions UI

1. Go to repository **Actions** tab
2. Select **Deploy to Production** workflow
3. Click **Run workflow**
4. Choose environment and branch
5. Click **Run workflow**

### Via Wrangler CLI

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build the app
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=geo-alert-commander

# Deploy to specific branch (for preview)
wrangler pages deploy dist --project-name=geo-alert-commander --branch=my-feature
```

## Custom Domain Setup

1. Go to Cloudflare Dashboard > Your Pages project
2. Navigate to **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain (e.g., `alerts.yourdomain.com`)
5. If domain is on Cloudflare:
   - DNS records are added automatically
   - SSL certificate is provisioned automatically
6. If domain is external:
   - Add the CNAME record shown to your DNS provider
   - Wait for DNS propagation (up to 24 hours)

**SSL/TLS Settings:**
- Go to **SSL/TLS** > **Overview**
- Set encryption mode to **Full** or **Full (strict)**

## Monitoring

### GitHub Actions Logs

1. Go to **Actions** tab in your repository
2. Click on a workflow run to see detailed logs
3. Each step shows output and errors
4. Deployment summary includes URLs and build stats

### Cloudflare Pages Dashboard

1. Go to Cloudflare Dashboard > **Workers & Pages**
2. Click on your project
3. View:
   - **Deployments:** History of all deployments
   - **Analytics:** Traffic and performance metrics
   - **Logs:** Real-time and historical logs

## Troubleshooting

### Build Fails

**"Module not found" error:**
- Check all dependencies are in `package.json`
- Ensure `package-lock.json` is committed
- Try `npm ci` locally to verify lockfile

**Type errors:**
- Run `npm run build` locally to reproduce
- Fix TypeScript errors before pushing

### Deployment Issues

**GitHub Actions workflow failing:**
- Verify secrets are set correctly in repository settings
- Check Cloudflare Pages project name matches (`geo-alert-commander`)
- Ensure API token has correct permissions
- Review workflow logs for specific errors

**PR preview not deploying:**
- PR from fork? Deployments are disabled for security
- Check if workflow is running in Actions tab
- Ensure PR doesn't only modify `.md` files

**Environment variables not working:**
- Variables must be set in Cloudflare Pages settings, not GitHub secrets
- Variable names must start with `VITE_` to be included in build
- Redeploy after adding/changing variables

### Preview URL Shows 404

- Wait a few minutes for deployment to propagate
- Check workflow logs for deployment URL
- Verify deployment completed successfully

## Rollback

### Via Cloudflare Dashboard

1. Go to your Pages project > **Deployments**
2. Find the previous successful deployment
3. Click **⋯** (three dots) > **Rollback to this deployment**
4. Confirm the rollback

### Via Git

```bash
# Revert last commit (recommended)
git revert HEAD
git push origin main

# OR reset to specific commit (use with caution)
git reset --hard <commit-sha>
git push --force origin main
```

## Security Best Practices

1. **Never commit secrets** - Use GitHub secrets and Cloudflare environment variables
2. **Protect main branch** - Require PR reviews before merging
3. **Fork security** - PR previews are disabled for forks to prevent secret exposure
4. **API token permissions** - Use minimal permissions (only Cloudflare Pages:Edit)
5. **Rotate tokens** - Regenerate API tokens periodically

## Cost

**Cloudflare Pages Free Tier:**
- Unlimited bandwidth
- Unlimited requests
- 500 builds per month
- 100 custom domains

For most projects, the free tier is sufficient. See [Cloudflare Pages Pricing](https://pages.cloudflare.com/#pricing) for details.

## Support

For deployment issues:

1. Check [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
2. Review [GitHub Actions Documentation](https://docs.github.com/en/actions)
3. Check workflow logs for specific error messages
4. Open an issue in this repository with deployment logs
