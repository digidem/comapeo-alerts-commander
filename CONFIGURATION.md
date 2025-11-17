# Configuration Guide

This guide covers all configuration options for CoMapeo Alerts Commander, including environment variables, API setup, and customization options.

## Environment Variables

Environment variables are used to configure the application at build time. They are defined in a `.env` file in the project root.

### Creating Your Configuration File

1. Copy the example file:
```bash
cp .env.example .env
```

2. Edit `.env` with your preferred settings

### Available Variables

#### VITE_MAPBOX_TOKEN

**Optional** - Mapbox API access token for premium map features.

```bash
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

**How to get a token:**
1. Create a free account at [Mapbox](https://account.mapbox.com/auth/signup/)
2. Navigate to [Access Tokens](https://account.mapbox.com/access-tokens/)
3. Create a new token or copy your default public token
4. Ensure the token has these scopes:
   - `styles:read`
   - `fonts:read`
   - `datasets:read`
   - `geocoding:read` (for location search)

**When to use a Mapbox token:**
- You want satellite imagery and high-quality vector tiles
- You need premium geocoding with detailed results
- You require accurate routing and directions (future feature)
- You prefer faster tile loading (Mapbox CDN is optimized)

**Without a Mapbox token:**
- App works perfectly with OpenStreetMap tiles
- Location search uses Nominatim (free OSM geocoding)
- No costs, no sign-up required
- Fully open-source stack
- Basic street map view only (no satellite)
- Slower geocoding with rate limits (1 request/second)

**Cost considerations:**
- Mapbox free tier: 50,000 map loads per month
- Geocoding free tier: 100,000 requests per month
- Most small to medium deployments stay within free tier

### Build-Time vs Runtime Configuration

**Build-time variables** (prefix with `VITE_`):
- Compiled into the JavaScript bundle
- Cannot be changed without rebuilding
- Used for: API tokens, feature flags, build settings

**Runtime configuration** (not yet implemented):
- Would be loaded when the app starts
- Can be changed without rebuilding
- Useful for: API endpoints, feature toggles

Currently, all configuration is build-time. If you need runtime configuration, consider environment-specific builds:

```bash
# Development build
npm run build:dev

# Production build
npm run build
```

## API Proxy Configuration

The development server includes a proxy to avoid CORS issues when connecting to CoMapeo servers.

### Development Proxy

Located in `vite.config.ts`:

```typescript
server: {
  port: 8080,
  proxy: {
    '/api': {
      target: 'https://demo.comapeo.cloud',
      changeOrigin: true,
    }
  }
}
```

**To change the target server:**

1. Open `vite.config.ts`
2. Update the `target` URL:
```typescript
'/api': {
  target: 'https://your-server.com',
  changeOrigin: true,
}
```
3. Restart the dev server

**Common proxy configurations:**

```typescript
// Local development server
target: 'http://localhost:3000'

// Staging server
target: 'https://staging.comapeo.cloud'

// Production server
target: 'https://api.comapeo.cloud'
```

### Production CORS Configuration

In production, there's no proxy. Your CoMapeo server must have proper CORS headers configured.

**Required CORS headers:**
```
Access-Control-Allow-Origin: https://your-app-domain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

**For Nginx:**
```nginx
location /api {
    add_header Access-Control-Allow-Origin https://your-app-domain.com;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    add_header Access-Control-Allow-Credentials true;
}
```

**For Apache:**
```apache
Header set Access-Control-Allow-Origin "https://your-app-domain.com"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization"
Header set Access-Control-Allow-Credentials "true"
```

## PWA Configuration

Progressive Web App settings are defined in `public/manifest.json`.

### Manifest Customization

```json
{
  "name": "CoMapeo Alerts Commander",
  "short_name": "Alerts",
  "description": "Create and manage geographic alerts",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ef4444",
  "icons": [
    // Generated automatically by npm run generate:icons
  ]
}
```

**Key fields to customize:**

- `name`: Full app name (shows during installation)
- `short_name`: Short name (shows on home screen)
- `description`: Brief description (shows in app stores)
- `theme_color`: Browser UI color (hex code)
- `background_color`: Splash screen background

### Icon Customization

See [ICONS.md](./ICONS.md) for detailed instructions on customizing app icons.

**Quick start:**
1. Replace `public/icon.svg` with your logo
2. Run `npm run generate:icons`
3. All icon sizes are generated automatically

## Service Worker Configuration

The service worker (`public/sw.js`) handles offline caching for static assets only.

### Cache Strategy

**Current implementation:**
- **Static assets only**: PWA icons, manifest.json, and root path
- **Cache-first strategy**: Serves from cache if available, fetches if not
- **API requests**: Explicitly NOT cached - always go directly to the network
- **Map tiles**: NOT cached - always fetched from the network

**What gets cached:**

The service worker caches these static files on installation:

```javascript
// public/sw.js
const CACHE_NAME = "comapeo-alert-v2";
const urlsToCache = [
  "/",
  "/manifest.json",
  "/icon.svg",
  "/favicon.ico",
  "/icon-72.png",
  "/icon-96.png",
  "/icon-128.png",
  // ... other icon sizes
];
```

**What does NOT get cached:**

The service worker explicitly skips these requests (lines 24-32):
- Any URL containing `/projects`
- Any URL containing `/alerts`
- Any URL containing `comapeo.cloud`
- Any URL containing `api.`

This means:
- The app shell loads offline (UI, icons, basic structure)
- API data requires internet connection
- Map tiles require internet connection
- Alert data requires internet connection

**Force service worker update:**

To force users to get an updated service worker, change the cache name:
```javascript
// public/sw.js
const CACHE_NAME = "comapeo-alert-v3"; // Increment the version number
```

This will cause the old cache to be deleted and a new one created.

## Map Configuration

### Default Map Settings

Map defaults are hard-coded in `src/hooks/useMapInteraction.ts` during map initialization.

**Current defaults** (when no location is selected):
- **Center**: `[0, 0]` (Prime Meridian/Equator)
- **Zoom**: `2` (world view)

**To change default map view:**

1. Find your desired coordinates (use [latlong.net](https://www.latlong.net/))
2. Open `src/hooks/useMapInteraction.ts`
3. Find the map initialization for both Mapbox (line 67) and MapLibre (line 112)
4. Update the center coordinates in both places:

```typescript
// For Mapbox (around line 70-72)
center: selectedCoords
  ? [selectedCoords.lng, selectedCoords.lat]
  : [-74.5, 40], // Change this: [longitude, latitude]
zoom: selectedCoords ? 10 : 9, // Change default zoom here

// For MapLibre (around line 115-117) - make the same changes
center: selectedCoords
  ? [selectedCoords.lng, selectedCoords.lat]
  : [-74.5, 40], // Change this: [longitude, latitude]
zoom: selectedCoords ? 10 : 9, // Change default zoom here
```

**Zoom levels:**
- `1` = World view
- `5` = Continent view
- `10` = City view
- `15` = Street view
- `20` = Building level

### Map Style Customization

**Mapbox styles:**

Located in the map initialization code:

```typescript
// Current style
style: 'mapbox://styles/mapbox/streets-v12'

// Other options:
// 'mapbox://styles/mapbox/satellite-streets-v12' - Satellite with labels
// 'mapbox://styles/mapbox/dark-v11' - Dark theme
// 'mapbox://styles/mapbox/light-v11' - Light theme
// 'mapbox://styles/mapbox/outdoors-v12' - Outdoors/hiking
```

**Custom Mapbox style:**

Create a custom style in [Mapbox Studio](https://studio.mapbox.com/):
1. Create and publish your style
2. Copy the style URL
3. Use it in the map configuration

**OpenStreetMap styles:**

When using MapLibre (no Mapbox token), styles are limited to OpenStreetMap-based options.

## Internationalization Configuration

### Supported Languages

Configured in `src/i18n/index.ts`:

```typescript
const supportedLanguages = ['en', 'pt', 'es', 'fr'];
```

### Adding a New Language

1. **Create translation file:**
```bash
cp src/i18n/locales/en.json src/i18n/locales/de.json
```

2. **Translate the content** (or use auto-translation):
```bash
# Install the translator tool
npm install -g ai-markdown-translator

# Generate translation
npx ai-markdown-translator \
  --input ./src/i18n/locales/en.json \
  --output ./src/i18n/locales/de.json \
  --language "German" \
  --extension "json"
```

3. **Register the language** in `src/i18n/index.ts`:
```typescript
const supportedLanguages = ['en', 'pt', 'es', 'fr', 'de'];
```

4. **Update language selector** in `src/components/LanguageSelector.tsx`:
```typescript
const languages = [
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Português' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' }, // Add this
];
```

### Default Language

Set in `src/i18n/index.ts`:

```typescript
i18n.changeLanguage('en'); // Change to your preferred default
```

Or detect from browser:
```typescript
i18n.changeLanguage(navigator.language.split('-')[0]);
```

## Authentication Configuration

### Credential Persistence

Users can optionally save their credentials locally. This is handled by browser localStorage.

**Security considerations:**
- Tokens are stored in plain text in localStorage
- Anyone with device access can read them
- Use only on trusted devices
- Consider implementing token encryption (future enhancement)

**To disable credential persistence:**

Remove the "Remember me" checkbox from `src/components/AuthForm.tsx` and always use session storage:

```typescript
// Use sessionStorage instead of localStorage
sessionStorage.setItem('authToken', token);
```

## Build Configuration

### Vite Configuration

Advanced build options in `vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false, // Enable for debugging
    minify: 'terser', // or 'esbuild' for faster builds
    target: 'es2020', // Browser support target
    chunkSizeWarningLimit: 1000, // Warning threshold
  }
});
```

**Common customizations:**

```typescript
// Enable source maps for production debugging
sourcemap: true

// Faster builds with esbuild minification
minify: 'esbuild'

// Support older browsers
target: 'es2015'

// Suppress chunk size warnings
chunkSizeWarningLimit: 2000
```

## Docker Configuration

See [DOCKER.md](./DOCKER.md) for complete Docker setup and configuration.

**Environment variables in Docker:**

```bash
# Pass at runtime
docker run -e VITE_MAPBOX_TOKEN=your_token app

# Or use docker-compose.yml
environment:
  - VITE_MAPBOX_TOKEN=${MAPBOX_TOKEN}
```

## Cloudflare Pages Configuration

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Cloudflare Pages setup.

**Environment variables in Cloudflare:**

1. Go to Cloudflare Pages dashboard
2. Select your project
3. Settings → Environment variables
4. Add `VITE_MAPBOX_TOKEN`
5. Deploy to apply changes

## Performance Configuration

### Code Splitting

Vite automatically splits code. To customize chunk strategy, edit `vite.config.ts`:

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        'vendor-ui': [
          '@radix-ui/react-dialog',
          '@radix-ui/react-select',
          // ... other UI libraries
        ],
      }
    }
  }
}
```

### Asset Optimization

Images and icons are optimized automatically. To customize:

```typescript
// In vite.config.ts
build: {
  assetsInlineLimit: 4096, // Inline assets smaller than 4KB
}
```

## Development vs Production

### Development Mode

```bash
npm run dev
```

Features:
- Fast HMR
- Detailed error messages
- Source maps enabled
- No minification
- Proxy enabled

### Production Mode

```bash
npm run build
npm run preview
```

Features:
- Minified code
- Tree-shaking
- Code splitting
- Optimized assets
- No source maps (unless configured)

### Environment-Specific Builds

Create `.env.production` for production-only variables:

```bash
# .env.production
VITE_MAPBOX_TOKEN=production_token_here
```

And `.env.development` for development:

```bash
# .env.development
VITE_MAPBOX_TOKEN=development_token_here
```

Vite automatically loads the correct file based on mode.

## Troubleshooting Configuration

For common configuration issues, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

## Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use different tokens for dev/prod** - Separate tokens for each environment
3. **Rotate tokens regularly** - Change tokens every 6 months
4. **Restrict token permissions** - Only enable required scopes
5. **Use HTTPS in production** - Cloudflare Pages enforces this
6. **Validate API responses** - Already implemented with Zod schemas
7. **Sanitize user input** - Already implemented in forms

## Next Steps

- [Development Guide](./DEVELOPMENT.md) - Development workflow and tools
- [Deployment Guide](./DEPLOYMENT.md) - Deploy to production
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
