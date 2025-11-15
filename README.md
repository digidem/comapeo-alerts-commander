# CoMapeo Alerts Commander

A Progressive Web App for creating and managing geographic alerts with interactive map integration. Built for the CoMapeo ecosystem, this application provides a mobile-first interface for field work and remote monitoring.

![PWA](https://img.shields.io/badge/PWA-enabled-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![React](https://img.shields.io/badge/React-18-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)

## Features

### Map & Location
- **Dual Map Support**: Automatically uses Mapbox GL (premium features) when token is provided, or falls back to OpenStreetMap (free, no token required)
- **Flexible Coordinate Input**:
  - Click directly on the map
  - Search locations by name (Mapbox Geocoding or Nominatim fallback)
  - Manual coordinate entry
- **Smart Map Behavior**:
  - Auto-fit bounds to show all alerts on load
  - Smooth zoom animations when selecting locations
  - Persistent view on language changes
- **Visual Alert Markers**: Red circular markers with labels, properly layered below UI elements

### Alert Management
- **Multi-Project Alerts**: Create and manage alerts across multiple CoMapeo projects simultaneously
- **Smart Defaults**: Auto-populated detection times (current time to +1 month)
- **Alert Visualization**: View all alerts for selected project on the map
- **Click-to-View Details**: Tap any alert marker to see full information

### Progressive Web App
- **Installable**: Add to home screen on mobile and desktop
- **Offline Support**: Service worker caching for offline functionality
- **App Shortcuts**: Quick access to "Create Alert" action
- **Customizable Icons**: Simple red circle default, easy to replace with your logo
- **Platform Optimized**: Works seamlessly on iOS, Android, and desktop

### User Experience
- **Internationalization**: Full support for English, Portuguese, Spanish, and French
- **Mobile-First Design**: Touch-optimized interface with haptic feedback
- **Responsive UI**: Adapts beautifully to any screen size
- **Secure Authentication**: Bearer token authentication with optional credential persistence
- **Dark Mode Ready**: Theme color support for system preferences

## Tech Stack

### Core
- **React 18** - Modern frontend framework with TypeScript
- **Vite 5** - Lightning-fast build tool with HMR
- **TypeScript 5.5** - Type-safe development

### UI & Styling
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality component library built on Radix UI
- **Radix UI** - Accessible, unstyled component primitives
- **Lucide Icons** - Beautiful, consistent iconography

### Maps & Geolocation
- **Mapbox GL JS** - Premium map features (satellite imagery, vector tiles)
- **MapLibre GL JS** - Open-source map rendering (OSM fallback)
- **Nominatim API** - Free geocoding service for location search

### Internationalization
- **i18next** - Translation framework
- **react-i18next** - React integration with SSR support
- **Auto-translation** - AI-powered translation pipeline for new languages

### Development
- **ESLint** - Code linting and quality
- **SWC** - Fast TypeScript/JSX compilation
- **Sharp** - High-performance icon generation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A CoMapeo server instance (or access to demo.comapeo.cloud)
- (Optional) Mapbox access token for premium map features

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd comapeo-alerts-commander
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, for Mapbox features):
```bash
cp .env.example .env
```

Edit `.env` and add your Mapbox token:
```
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Configuration

### Environment Variables

Create a `.env` file in the project root to customize the application:

```bash
# Mapbox Configuration (Optional)
# Get your free token at: https://account.mapbox.com/access-tokens/
# If not provided, app uses OpenStreetMap tiles and Nominatim geocoding
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

**When to use Mapbox token:**
- ✅ You want satellite imagery and high-quality vector tiles
- ✅ You need premium geocoding with detailed results
- ✅ You require accurate routing and directions (future feature)

**Without Mapbox token:**
- ✅ App works perfectly with OpenStreetMap tiles
- ✅ Location search uses Nominatim (free OSM geocoding)
- ✅ No costs, no sign-up required
- ⚠️ Basic street map view only (no satellite)

### API Proxy (Development)

The development server includes a proxy configuration for the CoMapeo API to avoid CORS issues:

```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'https://demo.comapeo.cloud', // Change to your server
    changeOrigin: true,
  }
}
```

For production, ensure your CoMapeo server has proper CORS headers configured.

## Usage

### Authentication

1. Enter your CoMapeo server URL (e.g., `https://demo.comapeo.cloud`)
2. Provide your bearer token
3. Optionally check "Remember me" to persist credentials

### Creating Alerts

1. Navigate to the map view
2. Click on the map to select coordinates (or use search/manual entry)
3. Click "Continue" to select projects
4. Fill in alert details:
   - Detection start time (defaults to current time)
   - Detection end time (defaults to one month from now)
   - Source ID
   - Alert name (slug format: lowercase, hyphens only)
5. Submit to create alerts for selected projects

### Managing Projects

- Use the project selector in the header to switch between projects
- View alerts for the selected project on the map
- Click on alert markers to view details

### Progressive Web App (PWA)

This application can be installed as a PWA on supported devices:

**Desktop:**
- Look for the install button in your browser's address bar
- Chrome/Edge: Click the install icon
- Firefox: Click the menu > Install

**Mobile:**
- iOS Safari: Tap Share > Add to Home Screen
- Android Chrome: Tap Menu > Add to Home Screen

**Customizing Icons:**

The app uses a simple red circle as the default icon. To use your own logo:

1. Replace `public/icon.svg` with your logo (SVG format recommended)
2. Run `npm run generate:icons` to generate all required sizes
3. All icon sizes will be automatically created

For detailed instructions, see [ICONS.md](./ICONS.md)

## Project Structure

```
comapeo-alerts-commander/
├── public/                  # Static assets
│   ├── icon.svg            # Source icon (replace with your logo)
│   ├── icon-*.png          # Generated PWA icons (auto-generated)
│   ├── manifest.json       # PWA manifest
│   └── sw.js               # Service worker
├── src/
│   ├── components/         # React components
│   │   ├── AlertForm.tsx   # Alert creation form
│   │   ├── MapInterface.tsx # Main map component
│   │   ├── ProjectSelector.tsx
│   │   └── ui/             # shadcn/ui components
│   ├── hooks/              # Custom React hooks
│   │   ├── useMapInteraction.ts  # Map click & interaction
│   │   ├── useMapAlerts.ts       # Alert markers & display
│   │   └── useMapSearch.ts       # Location search
│   ├── i18n/               # Internationalization
│   │   └── locales/        # Translation files (en, pt, es, fr)
│   ├── pages/              # Page components
│   │   └── Index.tsx       # Main app routing
│   ├── services/           # API services
│   │   └── apiService.ts   # CoMapeo API client
│   └── lib/                # Utility functions
├── scripts/
│   └── generate-icons.js   # Icon generation script
├── .env.example            # Environment variables template
├── ICONS.md                # Icon customization guide
└── vite.config.ts          # Vite configuration
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run generate:icons` - Generate PWA icons from source SVG
- `npm run translate:all` - Generate all translations

### Adding Translations

Translations are managed in `src/i18n/locales/`. To add a new translation:

1. Update `en.json` with new keys
2. Run `npm run translate:all` to generate translations for other languages

### Code Quality

```bash
# Run linter
npm run lint

# Build for production (checks for type errors)
npm run build

# Preview production build locally
npm run preview
```

## Performance & Optimization

### Build Optimization

The project uses intelligent code splitting to optimize bundle size:

- **Map Libraries**: Mapbox GL and MapLibre GL are split into separate chunks
- **React Vendor**: React core libraries are bundled separately for better caching
- **UI Vendor**: Radix UI components are chunked together
- **Lazy Loading**: Map libraries load on-demand based on token availability

### Bundle Analysis

After building, check the bundle sizes:

```bash
npm run build
# Look for generated chunks in dist/assets/
```

Typical production bundle breakdown:
- Main app: ~150KB (gzipped)
- Map libraries: ~700-800KB (gzipped, loaded separately)
- UI vendor: ~100KB (gzipped)

### Performance Tips

1. **Use Mapbox token for better performance** - Mapbox tiles load faster than OSM
2. **Enable service worker** - Caches assets for instant repeat loads
3. **Install as PWA** - Native-like performance on mobile devices
4. **Clear old caches** - Service worker auto-updates with new versions

## Docker

This project includes Docker support for easy containerization and deployment.

### Using Pre-built Images

Pull and run the latest image from Docker Hub:

```bash
# Pull the latest image
docker pull <dockerhub-username>/comapeo-alerts-commander:latest

# Run the container
docker run -p 8080:80 <dockerhub-username>/comapeo-alerts-commander:latest
```

The application will be available at `http://localhost:8080`

### Building Locally

Build the Docker image from source:

```bash
# Build the image
docker build -t comapeo-alerts-commander .

# Run the container
docker run -p 8080:80 comapeo-alerts-commander
```

### Docker Compose (Optional)

Create a `docker-compose.yml` file for easier management:

```yaml
version: '3.8'
services:
  web:
    image: <dockerhub-username>/comapeo-alerts-commander:latest
    ports:
      - "8080:80"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 3s
      retries: 3
```

Then run:

```bash
docker-compose up -d
```

### Available Tags

- `latest` - Latest build from main branch
- `v1.x.x` - Specific version tags (semantic versioning)
- `main` - Latest main branch build
- `main-<commit>` - Specific commit from main branch

### Multi-Platform Support

The Docker images are built for multiple architectures:
- `linux/amd64` - Standard x86_64 architecture
- `linux/arm64` - ARM64 architecture (Apple Silicon, AWS Graviton, etc.)

### Automated Builds

Docker images are automatically built and published to Docker Hub via GitHub Actions:
- **On push to main**: Builds and tags as `latest` and `main-<commit>`
- **On version tags**: Builds and tags with semantic versions (e.g., `v1.2.3`, `1.2`, `1`)
- **On pull requests**: Builds but doesn't push (validation only)

## Deployment

This project uses GitHub Actions to automatically deploy to Cloudflare Pages.

### Automatic Deployments

**Production Deployment:**
- Triggered automatically on every push to `main` branch
- Deploys to your production Cloudflare Pages URL
- Updates happen within minutes of merging

**PR Preview Deployments:**
- Automatically created for every pull request
- Each PR gets a unique preview URL: `https://pr-{number}.comapeo-alerts-commander.pages.dev`
- Preview updates automatically when you push new commits
- Comments on PR with deployment status and preview URL
- Forks cannot trigger deployments (security measure)

### Quick Setup

1. **Create a Cloudflare Pages project** named `comapeo-alerts-commander`
2. **Get your Cloudflare credentials:**
   - Account ID (found in Cloudflare Dashboard)
   - API Token with `Cloudflare Pages:Edit` permission
3. **Add GitHub Secrets:**
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
4. **Configure environment variables in Cloudflare** (optional):
   - Add `VITE_MAPBOX_TOKEN` for production builds

For detailed setup instructions, troubleshooting, and custom domain configuration, see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Workflow Files

- `.github/workflows/deploy-production.yml` - Production deployment on main branch
- `.github/workflows/deploy-pr-preview.yml` - PR preview deployments

## Troubleshooting

### Map not loading?

**Check browser console for errors:**
- If you see "Invalid Mapbox token" but want to use OSM, remove the token from `.env`
- If map is blank, ensure you have internet connectivity (first load requires tiles)

### Search not working?

- **With Mapbox token**: Verify token has Geocoding API enabled
- **Without token**: Nominatim has rate limits (1 request/second) - wait a moment between searches

### Icons not updating after replacement?

1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Check `public/icon-*.png` files were regenerated
3. Uninstall and reinstall PWA if already installed

### Build warnings about chunk size?

This is normal - Mapbox/MapLibre GL are large libraries (~700KB each). The app uses code splitting to load them separately, so it doesn't impact initial load time.

### Service worker not registering?

- Service workers require HTTPS (or localhost for development)
- Check browser console for registration errors
- Ensure `public/sw.js` exists and is accessible

### Authentication failing?

1. Verify server URL is correct (include https://)
2. Check bearer token is valid and not expired
3. Ensure server has proper CORS headers configured
4. Try with demo server: `https://demo.comapeo.cloud`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[Add your license information here]

## Acknowledgments

- Built for the [CoMapeo](https://www.comapeo.cloud/) ecosystem
- Maps powered by Mapbox and OpenStreetMap
- UI components from [shadcn/ui](https://ui.shadcn.com/)
