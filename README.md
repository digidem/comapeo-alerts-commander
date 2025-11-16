# CoMapeo Alerts Commander

A Progressive Web App for creating and managing geographic alerts with interactive map integration. Built for the CoMapeo ecosystem, this application provides a mobile-first interface for field work and remote monitoring.

![PWA](https://img.shields.io/badge/PWA-enabled-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![React](https://img.shields.io/badge/React-18-blue)

## What is CoMapeo Alerts Commander?

CoMapeo Alerts Commander is a web application that helps you create and manage location-based alerts across multiple CoMapeo projects. Whether you're monitoring environmental changes, tracking field observations, or coordinating remote teams, this tool provides an intuitive interface for geographic alert management.

### Key Features

- **Interactive Maps** - Click to select locations, search places, or enter coordinates manually
- **Multi-Project Support** - Manage alerts across multiple CoMapeo projects simultaneously
- **Smart Defaults** - Auto-populated detection times and intelligent form handling
- **Progressive Web App** - Install on any device, feels native, offline-ready app shell
- **Multilingual** - Full support for English, Portuguese, Spanish, and French
- **Flexible Maps** - Use Mapbox for premium features or OpenStreetMap for free, open-source mapping

## Quick Start

### Prerequisites

- Node.js 18 or higher
- A CoMapeo server (or use `demo.comapeo.cloud` for testing)
- (Optional) Mapbox token for satellite imagery

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd comapeo-alerts-commander

# Install dependencies
npm install

# (Optional) Configure Mapbox
cp .env.example .env
# Edit .env and add your Mapbox token

# Start development server
npm run dev
```

Visit `http://localhost:8080` and you're ready to go!

### Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

## Using the Application

### 1. Authentication

Connect to your CoMapeo server:
- Enter your server URL (e.g., `https://demo.comapeo.cloud`)
- Provide your bearer token
- Optionally enable "Remember me" to save credentials

### 2. Creating Alerts

1. Click on the map to select a location (or search/enter coordinates)
2. Click "Continue" to choose projects
3. Fill in alert details (times, source, name)
4. Submit to create alerts across selected projects

### 3. Viewing Alerts

- Select a project from the header dropdown
- All alerts for that project appear on the map
- Click any marker to view alert details

## Maps: Mapbox vs OpenStreetMap

The app supports both Mapbox (premium) and OpenStreetMap (free):

**With Mapbox Token:**
- ✅ Satellite imagery
- ✅ High-quality vector tiles
- ✅ Premium geocoding
- ✅ Faster tile loading

**Without Mapbox Token:**
- ✅ Free OpenStreetMap tiles
- ✅ No API key required
- ✅ Fully open-source
- ℹ️ Street view only (no satellite)

Get a free Mapbox token at [mapbox.com](https://account.mapbox.com/access-tokens/) - the free tier includes 50,000 map loads per month.

## Progressive Web App

Install CoMapeo Alerts Commander as a native app:

**Desktop:**
- Click the install icon in your browser's address bar
- Or check browser menu for "Install" option

**Mobile:**
- **iOS Safari**: Tap Share → Add to Home Screen
- **Android Chrome**: Tap Menu → Add to Home Screen

Once installed, the app feels like a native application. The app shell loads offline, but requires internet for maps and data.

### Customize Your App Icon

Want to use your own logo instead of the default icon?

1. Replace `public/icon.svg` with your logo (SVG recommended)
2. Run `npm run generate:icons`
3. All icon sizes are generated automatically

See [ICONS.md](./ICONS.md) for detailed instructions.

## Documentation

### For Users

- **[Configuration Guide](./CONFIGURATION.md)** - Environment variables, API setup, and customization options
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[Icon Customization](./ICONS.md)** - How to customize app icons

### For Developers

- **[Development Guide](./DEVELOPMENT.md)** - Development workflow, scripts, and best practices
- **[Tech Stack](./TECH_STACK.md)** - Detailed information about technologies used
- **[Testing Guide](./E2E_TESTING_README.md)** - End-to-end testing with Playwright

### For Deployment

- **[Deployment Guide](./DEPLOYMENT.md)** - Deploy to Cloudflare Pages
- **[Docker Guide](./DOCKER.md)** - Container deployment

## Common Commands

```bash
# Development
npm run dev                  # Start dev server
npm run build               # Production build
npm run preview             # Preview production build

# Code Quality
npm run lint                # Run ESLint
npm run lint -- --fix       # Auto-fix issues

# Translations
npm run translate:all       # Generate all translations

# PWA
npm run generate:icons      # Generate app icons

# Testing
npm run test:e2e           # Run E2E tests
npm run test:e2e:ui        # Run tests with UI
```

## Deployment

### Cloudflare Pages (Recommended)

The easiest way to deploy is via Cloudflare Pages with automatic GitHub integration:

1. Push code to GitHub
2. Connect repository to Cloudflare Pages
3. Configure build settings (see [DEPLOYMENT.md](./DEPLOYMENT.md))
4. Automatic deployments on every push

### Docker

Run with Docker for containerized deployment:

```bash
# Pull from Docker Hub
docker pull <dockerhub-username>/comapeo-alerts-commander:latest

# Run the container
docker run -p 8080:80 <dockerhub-username>/comapeo-alerts-commander:latest
```

See [DOCKER.md](./DOCKER.md) for detailed Docker instructions.

## Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm run lint && npm run test:e2e`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development guidelines.

## Tech Stack Highlights

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **Maps**: Mapbox GL / MapLibre GL
- **i18n**: i18next with auto-translation support
- **PWA**: Service Workers + Web App Manifest
- **Testing**: Playwright for E2E tests

For complete technology details, see [TECH_STACK.md](./TECH_STACK.md).

## Project Status

This project is actively maintained and used in production. Features are added based on community needs and feedback.

### Recent Updates

- ✅ Multi-platform Docker support (AMD64, ARM64)
- ✅ Automated CI/CD with GitHub Actions
- ✅ Comprehensive E2E test suite
- ✅ Four-language support (EN, PT, ES, FR)
- ✅ Dual map provider support

### Roadmap

- 🔄 Alert clustering for large datasets
- 🔄 Offline data synchronization
- 🔄 Push notifications
- 🔄 Advanced filtering and search
- 🔄 Export capabilities (CSV, GeoJSON)

## Support

Need help?

- **Documentation**: Start with this README and linked guides
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Troubleshooting**: See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **CoMapeo**: Visit [comapeo.cloud](https://www.comapeo.cloud/)

## License

[Add your license information here]

## Acknowledgments

Built with care for the [CoMapeo](https://www.comapeo.cloud/) ecosystem.

Special thanks to:
- Mapbox and OpenStreetMap for mapping services
- shadcn/ui for beautiful, accessible components
- The CoMapeo community for feedback and support

---

**Made with ❤️ for environmental monitoring and field work**
