# GitHub Actions Workflows

This directory contains automated workflows for the CoMapeo Alerts Commander project.

## Workflows Overview

### 1. Docker Build and Test (`docker-test.yml`)

**Purpose:** Validate Docker builds on all pull requests and main branch pushes

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`
- Ignores changes to documentation files (`**.md`, `docs/**`)

**What it does:**

1. **Dockerfile Linting**
   - Runs Hadolint to validate Dockerfile best practices
   - Checks for common errors and security issues
   - Fails on warnings and errors

2. **Build and Test**
   - Extracts project metadata from `package.json`
   - Builds Docker image for linux/amd64 and linux/arm64
   - Tests image structure and validates required files
   - Runs container and tests HTTP endpoints
   - Validates security headers
   - Checks health endpoint functionality

3. **PR Image Publishing** (Optional)
   - Tags PR images as `pr-<number>` (e.g., `pr-42`)
   - Pushes to Docker Hub if credentials are configured
   - Adds comment to PR with test instructions
   - Allows reviewers to test PR changes in Docker

**Required Secrets:**
- `DOCKERHUB_USERNAME` - Docker Hub username (optional for testing)
- `DOCKERHUB_TOKEN` - Docker Hub access token (optional for testing)

**Outputs:**
- Build summary with test results
- Image size and layer information
- HTTP endpoint test results
- Security header validation
- PR comment with pull/run commands

### 2. Publish Docker Image (`docker-publish.yml`)

**Purpose:** Build and publish production Docker images to Docker Hub

**Triggers:**
- Push to `main` branch
- Version tags (e.g., `v1.2.3`)
- Manual workflow dispatch
- Ignores changes to documentation files

**What it does:**

1. **Extract Project Metadata**
   - Reads project name and version from `package.json`
   - Uses this information for labels and tagging

2. **Build Multi-platform Image**
   - Builds for linux/amd64 and linux/arm64
   - Uses GitHub Actions cache for faster builds
   - Applies OCI labels with project metadata

3. **Intelligent Tagging**
   - `latest` - Latest build from main branch
   - `main` - Main branch identifier
   - `main-abc1234` - Commit-specific tag
   - `v1.2.3`, `1.2`, `1` - Semantic version tags (on version tags)
   - Custom tags via workflow dispatch

4. **Publish to Docker Hub**
   - Pushes all generated tags
   - Includes image digest for verification
   - Supports custom tags via manual trigger

5. **Verification**
   - Pulls the published image
   - Runs automated tests
   - Validates health endpoint and main page
   - Ensures image works correctly

**Required Secrets:**
- `DOCKERHUB_USERNAME` - Docker Hub username (required)
- `DOCKERHUB_TOKEN` - Docker Hub access token (required)

**Outputs:**
- Published tags and digest
- Pull and run commands
- Verification test results
- Platform information

### 3. Deploy to Production (`deploy-production.yml`)

**Purpose:** Deploy application to Cloudflare Pages

**Triggers:**
- Push to `main` branch
- Manual workflow dispatch

**What it does:**
- Installs dependencies with npm
- Builds the React application
- Deploys to Cloudflare Pages

**Required Secrets:**
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

### 4. Deploy PR Preview (`deploy-pr-preview.yml`)

**Purpose:** Create preview deployments for pull requests

**Triggers:**
- Pull requests to `main` branch

**What it does:**
- Builds the application
- Deploys to Cloudflare Pages with PR-specific URL
- Comments on PR with preview link

## Setup Instructions

### Docker Hub Configuration

1. **Create Docker Hub Account**
   - Sign up at https://hub.docker.com

2. **Create Access Token**
   - Go to Account Settings → Security
   - Click "New Access Token"
   - Give it a descriptive name (e.g., "GitHub Actions")
   - Copy the token (you won't see it again!)

3. **Add GitHub Secrets**
   - Go to your repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Add `DOCKERHUB_USERNAME` with your Docker Hub username
   - Add `DOCKERHUB_TOKEN` with the access token you created

### Cloudflare Pages Configuration

1. **Create Cloudflare Pages Project**
   - Create project named `comapeo-alerts-commander`

2. **Get API Credentials**
   - Account ID: Found in Cloudflare Dashboard
   - API Token: Create with "Cloudflare Pages:Edit" permission

3. **Add GitHub Secrets**
   - Add `CLOUDFLARE_API_TOKEN`
   - Add `CLOUDFLARE_ACCOUNT_ID`

## Usage

### For Pull Requests

When you create a PR:

1. **`docker-test.yml` runs automatically**
   - Lints the Dockerfile
   - Builds and tests the image
   - Posts results to PR

2. **Testing PR Docker Image**
   ```bash
   # Check the PR comment for the exact command
   docker pull <username>/comapeo-alerts-commander:pr-<number>
   docker run -p 8080:80 <username>/comapeo-alerts-commander:pr-<number>
   ```

3. **Preview Deployment**
   - `deploy-pr-preview.yml` creates Cloudflare preview
   - Access at `https://pr-<number>.comapeo-alerts-commander.pages.dev`

### For Main Branch

When you push to main or merge a PR:

1. **`docker-test.yml` validates the build**
   - Same validation as PRs
   - Must pass before publish workflow runs

2. **`docker-publish.yml` publishes to Docker Hub**
   - Tags as `latest`, `main`, and commit-specific tags
   - Multi-platform build (amd64, arm64)
   - Verifies the published image

3. **`deploy-production.yml` deploys to Cloudflare**
   - Builds and deploys production site
   - Updates production URL

### For Version Releases

When you create a version tag:

```bash
git tag v1.2.3
git push origin v1.2.3
```

1. **`docker-publish.yml` creates versioned images**
   - Tags: `v1.2.3`, `1.2.3`, `1.2`, `1`, `latest`
   - Allows users to pin to specific versions
   - Semantic versioning support

2. **Users can install specific versions**
   ```bash
   docker pull <username>/comapeo-alerts-commander:1.2.3
   ```

### Manual Workflow Dispatch

You can manually trigger workflows from the GitHub Actions tab:

**`docker-publish.yml`:**
- Choose whether to push to Docker Hub
- Optionally specify a custom tag
- Useful for testing or special releases

## Workflow Dependencies

```
Pull Request Flow:
  docker-test.yml → (PR comment with test image)
  deploy-pr-preview.yml → (Cloudflare preview)

Main Branch Flow:
  docker-test.yml → validates build
  docker-publish.yml → publishes to Docker Hub
  deploy-production.yml → deploys to Cloudflare

Version Tag Flow:
  docker-publish.yml → publishes versioned images
```

## Caching Strategy

Both workflows use GitHub Actions cache:

- **Docker layers**: Cached using `cache-from: type=gha`
- **Build cache**: Reused across workflow runs
- **Reduces build time**: Subsequent builds are much faster

## Best Practices

### For Contributors

1. **Always test locally first**
   ```bash
   docker build -t test .
   docker run -p 8080:80 test
   ```

2. **Check workflow results**
   - Review the Actions tab for any failures
   - Address Dockerfile linting issues
   - Ensure all tests pass

3. **Use PR images for testing**
   - Pull the PR-tagged image
   - Test in a clean environment
   - Verify all features work

### For Maintainers

1. **Version tagging**
   - Use semantic versioning (v1.2.3)
   - Create annotated tags with descriptions
   - Push tags to trigger versioned builds

2. **Monitoring**
   - Check workflow summaries regularly
   - Monitor Docker Hub for image sizes
   - Review security scanning results

3. **Secret rotation**
   - Rotate Docker Hub tokens periodically
   - Update GitHub secrets when changed
   - Monitor access logs

## Troubleshooting

### Workflow Fails on PR

**Dockerfile linting fails:**
- Check Hadolint output in workflow logs
- Fix Dockerfile issues
- Common issues: missing version pins, using `ADD` instead of `COPY`

**Build fails:**
- Check if `package.json` is valid
- Ensure all dependencies are correct
- Verify Node.js version compatibility

**Tests fail:**
- Check if nginx.conf is valid
- Verify required files exist in public/
- Test build locally first

### Publish Workflow Fails

**Authentication error:**
- Verify `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets
- Check token hasn't expired
- Ensure token has write permissions

**Multi-platform build fails:**
- Usually a dependency issue
- Check logs for platform-specific errors
- May need to update base images

**Verification fails:**
- Image may not be immediately available
- Check health endpoint implementation
- Verify nginx configuration

### PR Images Not Published

**Secrets not configured:**
- PR image publishing is optional
- Requires `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`
- Workflow continues even if push fails

**Fork PRs:**
- Forks don't have access to secrets (security)
- Fork PRs will build but not push
- Maintainers can manually trigger builds

## Monitoring and Metrics

### What to Monitor

1. **Build times**
   - Track workflow duration
   - Identify slow builds
   - Optimize caching

2. **Image sizes**
   - Check summary for size info
   - Monitor for unexpected growth
   - Optimize layers if needed

3. **Test results**
   - Track pass/fail rates
   - Identify flaky tests
   - Review security headers

4. **Docker Hub**
   - Monitor pull counts
   - Check for vulnerabilities
   - Review storage usage

### Metrics Available

- Workflow run history in Actions tab
- Build summaries for each run
- Image sizes and layer counts
- Test results and timings
- Docker Hub download statistics

## Security Considerations

### Secrets Management

- Never commit secrets to the repository
- Use GitHub Secrets for sensitive data
- Rotate tokens regularly
- Limit token permissions to minimum required

### Image Security

- Base images are scanned by Hadolint
- Uses official Node.js and nginx images
- Multi-stage builds minimize attack surface
- Security headers configured in nginx

### PR Security

- Fork PRs cannot access secrets
- PR images are tagged separately
- No automatic production deployments from forks
- Review all PRs before merging

## Additional Resources

- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Hadolint Documentation](https://github.com/hadolint/hadolint)
- [Docker Metadata Action](https://github.com/docker/metadata-action)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Dockerfile Best Practices](https://docs.docker.com/develop/dev-best-practices/)
