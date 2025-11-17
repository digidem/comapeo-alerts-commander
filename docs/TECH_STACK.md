# Tech Stack

This document provides detailed information about the technologies and libraries used in CoMapeo Alerts Commander.

## Core Technologies

### React 19
Modern frontend framework with concurrent rendering, automatic batching, and improved performance. We use TypeScript for type safety throughout the application.

**Current version**: 19.2.0

### Vite 7
Lightning-fast build tool with features including:
- Hot Module Replacement (HMR) for instant feedback during development
- Optimized production builds with automatic code splitting
- Native ES modules support
- Built-in TypeScript support

**Current version**: 7.2.2

### TypeScript 5.9
Provides type safety and better developer experience with:
- Strict type checking
- IntelliSense and autocomplete
- Compile-time error detection
- Better refactoring support

**Current version**: 5.9.3

## UI & Styling

### Tailwind CSS
Utility-first CSS framework that enables rapid UI development with:
- Responsive design utilities
- Dark mode support
- Custom design system integration
- Minimal CSS bundle size

### shadcn/ui
High-quality, accessible component library built on Radix UI:
- Copy-paste component architecture (no dependency bloat)
- Fully customizable with Tailwind CSS
- Accessible by default
- Tree-shakeable for optimal bundle size

### Radix UI
Unstyled, accessible component primitives:
- WAI-ARIA compliant
- Keyboard navigation support
- Focus management
- Screen reader friendly

### Lucide Icons
Beautiful, consistent icon library:
- 1000+ open-source icons
- Consistent design language
- Tree-shakeable (only import icons you use)
- MIT licensed

## Maps & Geolocation

### Mapbox GL JS
Premium mapping solution featuring:
- High-quality vector tiles
- Satellite imagery
- 3D terrain visualization
- Advanced styling capabilities
- Geocoding API for location search

**When to use:** When you need premium features like satellite imagery and advanced geocoding.

### MapLibre GL JS
Open-source fork of Mapbox GL, providing:
- OpenStreetMap tile support
- Vector map rendering
- Custom map styles
- No API key required
- Community-driven development

**When to use:** As a fallback when no Mapbox token is available, or for projects requiring fully open-source solutions.

### Nominatim API
Free geocoding service powered by OpenStreetMap:
- Location search by name
- Reverse geocoding (coordinates to address)
- No authentication required
- Rate limited (1 request/second for free tier)

**When to use:** When Mapbox Geocoding API is not available or for development/testing.

## Internationalization

### i18next
Comprehensive internationalization framework:
- JSON-based translation files
- Plural forms and context support
- Lazy loading of translations
- Interpolation and formatting

### react-i18next
React bindings for i18next:
- Hooks for functional components
- HOC for class components
- Server-side rendering support
- Automatic re-rendering on language change

### Supported Languages
- **English (en)** - Primary language
- **Portuguese (pt)** - Brazil and Portugal
- **Spanish (es)** - Latin America and Spain
- **French (fr)** - France and French-speaking regions

### Auto-translation
AI-powered translation pipeline using `ai-markdown-translator`:
- Automatic generation of translations from English source
- Maintains JSON structure and interpolation variables
- Logs translation process for review
- Configurable retry logic for API reliability

## Development Tools

### ESLint
Code linting and quality enforcement:
- React-specific rules
- TypeScript integration
- Automatic fixes for common issues
- Pre-commit hooks via Husky

### SWC (Speedy Web Compiler)
Rust-based JavaScript/TypeScript compiler:
- 20x faster than Babel
- Used by Vite for development and production builds
- JSX transformation
- TypeScript compilation

### Sharp
High-performance image processing:
- PWA icon generation
- Multiple format support (SVG, PNG, WebP)
- Efficient image resizing
- Used by `generate-icons.js` script

### Husky + lint-staged
Git hooks for code quality:
- Pre-commit linting
- TypeScript type checking
- Automatic formatting
- Prevents committing broken code

## State Management & Data Fetching

### TanStack Query (React Query)
Powerful data synchronization library:
- Automatic caching
- Background refetching
- Optimistic updates
- Loading and error states

### React Hook Form
Performant form management:
- Minimal re-renders
- Built-in validation
- TypeScript support
- Integration with Zod schemas

### Zod
TypeScript-first schema validation:
- Runtime type checking
- Form validation
- API response validation
- Type inference

## Routing

### React Router v7
Client-side routing solution:
- Declarative routing
- Nested routes
- Route-based code splitting
- Type-safe route parameters

## PWA Technologies

### Service Workers
Enables basic offline functionality:
- **Static asset caching** - PWA icons, manifest, and root path
- **Cache-first strategy** - Instant loading of cached assets
- **Selective caching** - API requests are explicitly NOT cached to ensure fresh data
- **Background sync** - Not yet implemented (future feature)
- **Push notifications** - Not yet implemented (future feature)

**Important limitations:**
- API data (projects, alerts) requires internet connection
- Map tiles are not cached and require internet connection
- Only the app shell (UI structure and icons) works offline

### Web App Manifest
Defines PWA installation behavior:
- App name and icons
- Display mode (standalone)
- Theme colors
- App shortcuts

## Build Optimization

### Code Splitting Strategy

The build process automatically splits code into optimized chunks:

**Map Libraries** (~700-800KB gzipped)
- `mapbox-gl.js` - Loaded only when Mapbox token is available
- `maplibre-gl.js` - Loaded when using OpenStreetMap fallback
- Never loaded together (mutually exclusive)

**React Vendor** (~150KB gzipped)
- React core
- React DOM
- React Router
- Long-term cacheable (rarely changes)

**UI Vendor** (~100KB gzipped)
- Radix UI components
- shadcn/ui components
- Grouped for better caching

**Main App** (~150KB gzipped)
- Application code
- Business logic
- Custom components

### Bundle Analysis

After building, you can analyze bundle composition:

```bash
npm run build
```

Look for chunk breakdown in the build output. Typical production bundle:
- Total JavaScript: ~1.1MB uncompressed, ~400KB gzipped
- Map libraries: Loaded on-demand, not in initial bundle
- Critical path: ~150-200KB gzipped

### Performance Optimizations

1. **Lazy Loading**: Map libraries load dynamically based on configuration
2. **Tree Shaking**: Vite removes unused code automatically
3. **Minification**: JavaScript and CSS are minified in production
4. **Asset Optimization**: Images and icons are optimized during build
5. **HTTP/2**: Cloudflare Pages serves with HTTP/2 for parallel downloads

## Browser Support

### Modern Browsers
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

### Mobile Browsers
- iOS Safari 14+
- Chrome for Android 90+
- Samsung Internet 14+

### Progressive Enhancement
- Core functionality works in older browsers
- Advanced features (PWA, service workers) gracefully degrade
- No hard dependencies on cutting-edge APIs

## API Integration

### Axios
HTTP client for API requests:
- Promise-based
- Request/response interceptors
- Automatic JSON transformation
- Error handling

### CoMapeo API
RESTful API integration:
- Bearer token authentication
- Project management
- Alert CRUD operations
- Geospatial data handling

## Testing (Future)

The project is set up to support:
- **Playwright** - End-to-end testing
- **Vitest** - Unit testing (planned)
- **Testing Library** - Component testing (planned)

See `E2E_TESTING_README.md` for more details on the testing setup.

## Development Server

### Vite Dev Server
Features during development:
- Instant hot module replacement
- Optimized dependency pre-bundling
- Source map support
- API proxy configuration for CORS

### Proxy Configuration
Development server proxies API requests:

```typescript
proxy: {
  '/api': {
    target: 'https://demo.comapeo.cloud',
    changeOrigin: true,
  }
}
```

This avoids CORS issues when developing locally against remote APIs.

## Production Deployment

### Cloudflare Pages
Modern hosting platform with:
- Global CDN
- Automatic HTTPS
- Edge computing
- GitHub integration
- Preview deployments for PRs

### Docker
Containerization support:
- Multi-platform builds (AMD64, ARM64)
- Nginx-based serving
- Automated builds via GitHub Actions
- Published to Docker Hub

See [DEPLOYMENT.md](./DEPLOYMENT.md) and [DOCKER.md](./DOCKER.md) for more details.

## Security

### Authentication
- Bearer token authentication
- Secure credential storage (optional)
- No credentials in source code

### HTTPS
- Required for service workers
- Enforced by Cloudflare Pages
- Development works on localhost (exempt from HTTPS requirement)

### CORS
- Configurable via proxy in development
- Must be configured on CoMapeo server for production

### Content Security Policy
- Planned for future implementation
- Will restrict inline scripts and external resources

## License & Dependencies

All dependencies are open-source and compatible with commercial use:
- MIT License (majority)
- Apache 2.0 (some libraries)
- ISC License (some utilities)

No GPL or copyleft licenses that would restrict commercial use.

## Version Management

### Semantic Versioning
Project follows semver:
- Major: Breaking changes
- Minor: New features
- Patch: Bug fixes

### Dependency Updates
- Regular updates via Dependabot (planned)
- Manual review for major version bumps
- Testing before merging updates
