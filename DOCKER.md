# Docker Deployment Guide

This guide explains how to build, deploy, and manage the CoMapeo Alerts Commander application using Docker.

## Quick Start

### Using Pre-built Images

The easiest way to get started is using pre-built images from Docker Hub:

```bash
# Pull the latest image
docker pull <dockerhub-username>/comapeo-alerts-commander:latest

# Run the container
docker run -d -p 8080:80 --name comapeo-alerts <dockerhub-username>/comapeo-alerts-commander:latest

# Check the application
curl http://localhost:8080/health
```

Open your browser to `http://localhost:8080`

### Building from Source

To build the Docker image locally:

```bash
# Clone the repository
git clone <repository-url>
cd comapeo-alerts-commander

# Build the image
docker build -t comapeo-alerts-commander .

# Run the container
docker run -d -p 8080:80 --name comapeo-alerts comapeo-alerts-commander
```

## Docker Architecture

### Multi-Stage Build

The Dockerfile uses a multi-stage build to optimize image size:

**Stage 1: Builder**
- Base: `node:20-alpine`
- Installs all dependencies (including dev dependencies)
- Builds the React application with Vite
- Output: `/app/dist` directory with optimized static files

**Stage 2: Production**
- Base: `nginx:alpine`
- Copies only the built static files from the builder stage
- Uses custom nginx configuration for SPA routing
- Final image size: ~50MB (vs ~500MB if including Node.js)

### Nginx Configuration

The production container uses nginx with custom configuration for:

1. **SPA Routing**: All routes fall back to `index.html`
2. **Service Worker**: No-cache headers for `sw.js`
3. **Static Assets**: Long-term caching with immutable headers
4. **Gzip Compression**: Reduces bandwidth usage
5. **Security Headers**: XSS protection, frame options, content type
6. **Health Check**: `/health` endpoint for monitoring

## Container Configuration

### Environment Variables

Currently, the application is built with environment variables baked in at build time. For dynamic configuration:

```bash
# Build with custom Mapbox token
docker build \
  --build-arg VITE_MAPBOX_TOKEN=your_token_here \
  -t comapeo-alerts-commander .
```

### Port Configuration

The container exposes port 80 by default. Map it to your desired host port:

```bash
# Map to port 8080
docker run -p 8080:80 comapeo-alerts-commander

# Map to port 3000
docker run -p 3000:80 comapeo-alerts-commander

# Map to standard HTTP port (requires sudo/admin)
docker run -p 80:80 comapeo-alerts-commander
```

### Volume Mounts (Optional)

For development or custom configurations:

```bash
# Mount custom nginx config
docker run -v $(pwd)/custom-nginx.conf:/etc/nginx/conf.d/default.conf \
  -p 8080:80 comapeo-alerts-commander
```

## Docker Compose

### Basic Setup

The repository includes an example Docker Compose file. Copy and customize it:

```bash
# Copy the example file
cp docker-compose.example.yml docker-compose.yml

# Edit with your Docker Hub username
nano docker-compose.yml  # or use your preferred editor
```

The example file includes:
- Pre-configured health checks
- Resource limits (commented out, ready to enable)
- Multiple deployment options (pre-built image or local build)
- Network and volume examples
- Labels for organization

Run with:

```bash
docker-compose up -d
```

View the example file for all available configuration options.

### With Custom Build

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: comapeo-alerts
    ports:
      - "8080:80"
    restart: unless-stopped
```

### Behind Reverse Proxy

With Traefik:

```yaml
version: '3.8'

services:
  web:
    image: <dockerhub-username>/comapeo-alerts-commander:latest
    container_name: comapeo-alerts
    restart: unless-stopped
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.comapeo.rule=Host(`alerts.example.com`)"
      - "traefik.http.routers.comapeo.entrypoints=websecure"
      - "traefik.http.routers.comapeo.tls.certresolver=letsencrypt"
    networks:
      - traefik

networks:
  traefik:
    external: true
```

## Production Deployment

### Container Orchestration

#### Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Create service
docker service create \
  --name comapeo-alerts \
  --publish 8080:80 \
  --replicas 3 \
  --update-parallelism 1 \
  --update-delay 10s \
  <dockerhub-username>/comapeo-alerts-commander:latest
```

#### Kubernetes

Create `deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: comapeo-alerts
spec:
  replicas: 3
  selector:
    matchLabels:
      app: comapeo-alerts
  template:
    metadata:
      labels:
        app: comapeo-alerts
    spec:
      containers:
      - name: web
        image: <dockerhub-username>/comapeo-alerts-commander:latest
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: comapeo-alerts
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 80
  selector:
    app: comapeo-alerts
```

Deploy:

```bash
kubectl apply -f deployment.yaml
```

### Cloud Platforms

#### AWS ECS/Fargate

1. Push image to ECR:
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag comapeo-alerts-commander:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/comapeo-alerts:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/comapeo-alerts:latest
```

2. Create ECS task definition and service via AWS Console or CLI

#### Google Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/<project-id>/comapeo-alerts

# Deploy
gcloud run deploy comapeo-alerts \
  --image gcr.io/<project-id>/comapeo-alerts \
  --platform managed \
  --port 80 \
  --allow-unauthenticated
```

#### Azure Container Instances

```bash
# Push to ACR
az acr build --registry <registry-name> --image comapeo-alerts:latest .

# Deploy
az container create \
  --resource-group <resource-group> \
  --name comapeo-alerts \
  --image <registry-name>.azurecr.io/comapeo-alerts:latest \
  --dns-name-label comapeo-alerts \
  --ports 80
```

## Image Tags and Versioning

### Available Tags

- `latest` - Latest stable build from main branch
- `v1.2.3` - Specific semantic version
- `1.2` - Major.minor version (updates with patches)
- `1` - Major version (updates with minor releases)
- `main` - Latest main branch build
- `main-abc1234` - Specific commit from main

### Best Practices

**Production**: Pin to specific version
```bash
docker pull <dockerhub-username>/comapeo-alerts-commander:v1.2.3
```

**Development/Staging**: Use latest or main
```bash
docker pull <dockerhub-username>/comapeo-alerts-commander:latest
```

## Monitoring and Health Checks

### Health Check Endpoint

The application includes a `/health` endpoint that returns:

```
HTTP/1.1 200 OK
Content-Type: text/plain

healthy
```

### Docker Health Check

Built-in health check runs every 30 seconds:

```bash
# Check container health
docker ps

# View health check logs
docker inspect --format='{{json .State.Health}}' <container-id> | jq
```

### Monitoring with Prometheus

Export nginx metrics using `nginx-prometheus-exporter`:

```yaml
services:
  web:
    image: <dockerhub-username>/comapeo-alerts-commander:latest
    # ... other config ...

  nginx-exporter:
    image: nginx/nginx-prometheus-exporter:latest
    command:
      - -nginx.scrape-uri=http://web:80/nginx_status
    ports:
      - "9113:9113"
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs <container-id>

# Check events
docker events

# Inspect container
docker inspect <container-id>
```

### Application not accessible

```bash
# Check if container is running
docker ps

# Check port mapping
docker port <container-id>

# Test from inside container
docker exec <container-id> wget -O- http://localhost/health
```

### Permission issues

```bash
# Run with specific user (if needed)
docker run --user 1000:1000 -p 8080:80 comapeo-alerts-commander
```

### Build failures

```bash
# Clear build cache
docker builder prune -a

# Build with no cache
docker build --no-cache -t comapeo-alerts-commander .

# Check build logs
docker build --progress=plain -t comapeo-alerts-commander .
```

## Security Considerations

### Image Security

1. **Use specific tags**: Avoid `latest` in production
2. **Scan for vulnerabilities**:
   ```bash
   docker scan comapeo-alerts-commander:latest
   ```
3. **Keep base images updated**: Alpine images are regularly updated
4. **Non-root user**: Nginx runs as non-root by default

### Network Security

1. **Use HTTPS**: Always use TLS in production
2. **Limit exposure**: Only expose necessary ports
3. **Use secrets**: Never hardcode tokens in images
4. **Network isolation**: Use Docker networks for isolation

### Runtime Security

```bash
# Run with read-only filesystem
docker run --read-only -p 8080:80 comapeo-alerts-commander

# Drop capabilities
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE comapeo-alerts-commander

# Limit resources
docker run --memory=512m --cpus=1 comapeo-alerts-commander
```

## Performance Optimization

### Build Optimization

The Dockerfile uses several optimizations:

1. **Multi-stage build**: Reduces final image size
2. **Layer caching**: Copies `package*.json` before source code
3. **Alpine base**: Minimal image size
4. **.dockerignore**: Excludes unnecessary files

### Runtime Optimization

1. **Gzip compression**: Enabled by default in nginx.conf
2. **Static asset caching**: Long-term cache headers
3. **HTTP/2**: Enable in reverse proxy
4. **CDN**: Consider CloudFlare or similar for edge caching

### Resource Limits

```bash
# Set memory limits
docker run --memory=512m --memory-swap=512m comapeo-alerts-commander

# Set CPU limits
docker run --cpus=1.5 comapeo-alerts-commander

# Combined
docker run --memory=512m --cpus=1 -p 8080:80 comapeo-alerts-commander
```

## CI/CD Integration

### GitHub Actions Workflows

The repository includes two automated workflows for Docker:

#### 1. Docker Build and Test (`.github/workflows/docker-test.yml`)

**Triggers:**
- Every pull request
- Every push to `main` or `develop` branches

**What it does:**
1. **Lints Dockerfile** using Hadolint
2. **Builds** Docker image for linux/amd64 and linux/arm64
3. **Validates** image structure and required files
4. **Tests** HTTP endpoints and security headers
5. **Publishes** PR-specific images (e.g., `pr-42`) for testing
6. **Comments** on PR with test instructions

**Test Coverage:**
- Dockerfile best practices validation
- Image size and layer analysis
- Health endpoint functionality
- SPA routing behavior
- Security header presence
- Static asset caching

#### 2. Publish Docker Image (`.github/workflows/docker-publish.yml`)

**Triggers:**
- Push to `main` branch
- Version tags (e.g., `v1.2.3`)
- Manual workflow dispatch

**What it does:**
1. **Extracts** project metadata from `package.json`
2. **Builds** multi-platform images (amd64, arm64)
3. **Tags** with intelligent versioning
4. **Pushes** to Docker Hub
5. **Verifies** published image works correctly

**Generated Tags:**
- `latest` - Latest main branch build
- `main-abc1234` - Commit-specific tag
- `v1.2.3`, `1.2`, `1` - Semantic version tags
- Custom tags via workflow dispatch

### Setup Requirements

#### Required Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

**For Docker Hub publishing:**
- `DOCKERHUB_USERNAME` - Your Docker Hub username
- `DOCKERHUB_TOKEN` - Docker Hub access token

**How to create a Docker Hub token:**
1. Go to https://hub.docker.com/settings/security
2. Click "New Access Token"
3. Name it "GitHub Actions" (or similar)
4. Copy the token (you won't see it again!)
5. Add it to GitHub Secrets as `DOCKERHUB_TOKEN`

### Workflow Usage

#### Testing Pull Requests

When you create a PR, the test workflow:
1. Validates your Dockerfile changes
2. Builds and tests the image
3. Publishes a PR-specific image (if credentials configured)
4. Comments on the PR with instructions

**Test the PR image:**
```bash
# Pull the PR image (from PR comment)
docker pull <username>/comapeo-alerts-commander:pr-42

# Run it locally
docker run -p 8080:80 <username>/comapeo-alerts-commander:pr-42

# Test in your browser
open http://localhost:8080
```

#### Publishing to Production

When you merge to main:
1. Test workflow validates the build
2. Publish workflow creates and pushes images
3. Images are tagged as `latest` and commit-specific

**Creating version releases:**
```bash
# Create and push a version tag
git tag -a v1.2.3 -m "Release version 1.2.3"
git push origin v1.2.3
```

This creates images with tags:
- `v1.2.3`, `1.2.3`, `1.2`, `1`, `latest`

### Monitoring Workflows

**Check workflow status:**
- Go to the "Actions" tab in GitHub
- View workflow runs and logs
- Check build summaries for details

**What to look for:**
- Build duration (should use cache after first run)
- Image size (check for unexpected growth)
- Test results (all should pass)
- Security headers (all should be present)

### Manual Workflow Triggers

You can manually trigger the publish workflow:

1. Go to Actions → "Publish Docker Image to Docker Hub"
2. Click "Run workflow"
3. Choose whether to push to Docker Hub
4. Optionally specify a custom tag
5. Click "Run workflow"

Useful for:
- Testing workflow changes
- Creating special release tags
- Republishing after fixes

### Caching Strategy

Both workflows use GitHub Actions cache:
- Docker build layers are cached
- Subsequent builds are much faster
- Cache is shared across workflow runs
- Reduces build time from ~10min to ~2min

### Continuous Integration Benefits

**Automated quality checks:**
- Every PR is validated before merge
- Dockerfile linting catches issues early
- Automated testing ensures reliability
- Security headers are verified

**Fast feedback:**
- Results available within minutes
- PR comments show test status
- Build summaries provide details
- Failed tests prevent merging

**Consistent builds:**
- Same build process every time
- Multi-platform support guaranteed
- Version tagging is automatic
- No manual steps required

## Additional Resources

- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Multi-platform Builds](https://docs.docker.com/build/building/multi-platform/)

## Support

For issues related to:
- **Application**: Check main README.md
- **Docker build**: Review this guide and Dockerfile
- **GitHub Actions**: Check workflow logs in Actions tab
- **Docker Hub**: Verify credentials and organization access
