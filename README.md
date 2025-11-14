# Geo Alert Commander

A web application for creating and managing geographic alerts with map integration. Built for the CoMapeo ecosystem.

## Features

- **Interactive Map Interface**: View and interact with geographic data using Mapbox GL (with token) or OpenStreetMap tiles (fallback)
- **Alert Management**: Create, view, and manage geographic alerts for different projects
- **Multi-Project Support**: Work with multiple projects and switch between them seamlessly
- **Coordinate Selection**: Click on map, search locations, or manually enter coordinates
- **Authentication**: Secure login with bearer token authentication
- **Internationalization**: Support for multiple languages (English, Portuguese, Spanish, French)
- **PWA Support**: Install as a Progressive Web App for offline capabilities
- **Mobile-First Design**: Responsive UI optimized for mobile and desktop use

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: Radix UI + shadcn/ui
- **Styling**: Tailwind CSS
- **Maps**: Mapbox GL JS / MapLibre GL JS
- **State Management**: React hooks and context
- **Internationalization**: i18next
- **API Client**: Axios

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A CoMapeo server instance (or access to demo.comapeo.cloud)
- (Optional) Mapbox access token for premium map features

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd geo-alert-commander
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

- `VITE_MAPBOX_TOKEN`: (Optional) Mapbox access token for premium map features and geocoding search. If not provided, the app uses OpenStreetMap tiles.

### API Proxy

The development server includes a proxy configuration for the CoMapeo API to avoid CORS issues. By default, it proxies to `https://demo.comapeo.cloud`. You can modify this in `vite.config.ts`.

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
src/
├── components/       # React components
├── hooks/           # Custom React hooks
├── i18n/            # Internationalization files
├── pages/           # Page components
├── services/        # API services
└── lib/             # Utility functions
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
