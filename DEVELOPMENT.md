# Development Guide

This guide covers everything you need to know for developing CoMapeo Alerts Commander, including workflows, tools, best practices, and optimization techniques.

## Getting Started

### Prerequisites

- **Node.js 18+** and npm
- **Git** for version control
- A code editor (VS Code recommended)
- A CoMapeo server instance or access to `demo.comapeo.cloud`

### Initial Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd comapeo-alerts-commander
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create environment file** (optional):
```bash
cp .env.example .env
# Edit .env to add your Mapbox token if desired
```

4. **Start development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## Available Scripts

### Development

```bash
# Start dev server with HMR
npm run dev
```

Features:
- Hot Module Replacement (instant updates)
- Source maps for debugging
- API proxy to avoid CORS
- Fast refresh for React components

### Building

```bash
# Production build
npm run build

# Development build (with source maps)
npm run build:dev

# Preview production build locally
npm run preview
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### PWA Icons

```bash
# Generate all PWA icons from source SVG
npm run generate:icons
```

See [ICONS.md](./ICONS.md) for detailed instructions.

### Translations

```bash
# Generate all translations from English
npm run translate:all

# Generate specific language
npm run translate:pt  # Portuguese
npm run translate:es  # Spanish
npm run translate:fr  # French
```

### Testing

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# Run specific browser
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# View test report
npm run test:e2e:report

# Visual regression tests
npm run test:visual
npm run test:visual:update  # Update snapshots
```

See `E2E_TESTING_README.md` for comprehensive testing documentation.

## Project Structure

```
comapeo-alerts-commander/
├── .github/
│   └── workflows/          # CI/CD workflows
├── public/                 # Static assets (served as-is)
│   ├── icon.svg           # Source icon (replace with your logo)
│   ├── icon-*.png         # Generated PWA icons
│   ├── manifest.json      # PWA manifest
│   └── sw.js              # Service worker
├── src/
│   ├── components/        # React components
│   │   ├── AlertForm.tsx  # Alert creation form
│   │   ├── MapInterface.tsx  # Main map component
│   │   ├── ProjectSelector.tsx  # Project switcher
│   │   └── ui/            # shadcn/ui components
│   ├── hooks/             # Custom React hooks
│   │   ├── useMapInteraction.ts  # Map click handling
│   │   ├── useMapAlerts.ts       # Alert markers
│   │   └── useMapSearch.ts       # Location search
│   ├── i18n/              # Internationalization
│   │   ├── index.ts       # i18next configuration
│   │   └── locales/       # Translation files (en, pt, es, fr)
│   ├── pages/             # Page components
│   │   └── Index.tsx      # Main app routing
│   ├── services/          # API services
│   │   └── apiService.ts  # CoMapeo API client
│   ├── lib/               # Utility functions
│   ├── App.tsx            # Root component
│   └── main.tsx           # Entry point
├── scripts/
│   └── generate-icons.js  # Icon generation script
├── tests/                 # E2E tests (Playwright)
├── .env.example           # Environment variables template
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## Development Workflow

### Adding a New Feature

1. **Create a feature branch:**
```bash
git checkout -b feature/your-feature-name
```

2. **Implement the feature:**
- Write code in `src/`
- Add translations to `src/i18n/locales/en.json`
- Update types in TypeScript files
- Test manually in the browser

3. **Generate translations:**
```bash
npm run translate:all
```

4. **Run linter:**
```bash
npm run lint
```

5. **Build and test:**
```bash
npm run build
npm run preview
```

6. **Commit and push:**
```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

7. **Create a pull request** on GitHub

### Fixing a Bug

1. **Create a bugfix branch:**
```bash
git checkout -b fix/bug-description
```

2. **Reproduce the bug** and write a test if possible

3. **Implement the fix**

4. **Test thoroughly:**
```bash
npm run dev  # Manual testing
npm run build && npm run preview  # Production build testing
npm run test:e2e  # E2E tests
```

5. **Commit with clear message:**
```bash
git commit -m "fix: description of what was fixed"
```

### Code Review Checklist

Before submitting a PR:
- [ ] Code follows TypeScript best practices
- [ ] No ESLint errors or warnings
- [ ] Build succeeds without errors
- [ ] Translations updated for new text
- [ ] Manual testing completed
- [ ] E2E tests pass (if applicable)
- [ ] No console errors in browser
- [ ] Responsive design works on mobile
- [ ] Accessibility considerations met

## Performance Optimization

### Build Optimization

The project uses several optimization strategies:

#### 1. Code Splitting

Vite automatically splits code into chunks for optimal loading:

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'mapbox-gl': ['mapbox-gl'],
        'maplibre-gl': ['maplibre-gl'],
        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        'vendor-ui': [/* Radix UI components */],
      }
    }
  }
}
```

**Result:**
- Map libraries: ~700KB gzipped (loaded on-demand)
- React vendor: ~150KB gzipped (cached long-term)
- UI vendor: ~100KB gzipped
- Main app: ~150KB gzipped

#### 2. Lazy Loading

Map libraries are loaded dynamically based on configuration:

```typescript
// Only load the map library that's needed
const mapLibrary = hasMapboxToken
  ? await import('mapbox-gl')
  : await import('maplibre-gl');
```

**Benefit:** Users only download one map library, saving ~700KB.

#### 3. Tree Shaking

Import only what you need:

```typescript
// Good: Tree-shakeable
import { Button } from '@/components/ui/button';

// Bad: Imports everything
import * as UI from '@/components/ui';
```

#### 4. Asset Optimization

Images and icons are optimized during build:
- SVG icons: Minimal size
- PNG icons: Optimized with Sharp
- Inline small assets (<4KB)

### Runtime Optimization

#### 1. React Performance

Use proper React patterns:

```typescript
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Memoize components
const MemoizedComponent = memo(Component);
```

#### 2. API Request Optimization

Using TanStack Query for efficient data fetching:

```typescript
// Automatic caching and deduplication
const { data, isLoading } = useQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

**Benefits:**
- Automatic caching
- Deduplicates identical requests
- Background refetching
- Optimistic updates

#### 3. Map Performance

Optimize map rendering:

```typescript
// Limit map markers
const markers = alerts.slice(0, 100); // Show max 100 markers

// Use clustering for many points (future enhancement)
// Use GeoJSON sources instead of individual markers
```

### Bundle Analysis

To analyze bundle size:

```bash
npm run build
```

Look for the build output showing chunk sizes:

```
dist/assets/index-abc123.js           150.00 kB │ gzip:  45.00 kB
dist/assets/vendor-react-def456.js    180.00 kB │ gzip:  58.00 kB
dist/assets/mapbox-gl-ghi789.js       750.00 kB │ gzip: 220.00 kB
```

**Target sizes:**
- Main app: <200KB gzipped
- Vendor chunks: <100KB gzipped each
- Map libraries: <800KB gzipped (acceptable for mapping functionality)

### Performance Tips

1. **Use Mapbox token** - Mapbox tiles load faster than OSM
2. **Enable service worker** - Instant repeat loads
3. **Install as PWA** - Native-like performance
4. **Optimize images** - Use appropriate formats and sizes
5. **Lazy load routes** - Split routes into separate chunks (future)
6. **Minimize re-renders** - Use React.memo and useMemo appropriately
7. **Cache API responses** - Already implemented with TanStack Query

## Debugging

### Browser DevTools

**React DevTools:**
- Install React DevTools extension
- Inspect component tree
- Profile component performance

**Network Tab:**
- Monitor API requests
- Check cache behavior
- Analyze bundle loading

**Console:**
- Check for errors and warnings
- Use `console.log()` for debugging (remove before commit)

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:8080",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

Then press F5 to start debugging with breakpoints.

### Source Maps

Enable source maps for better debugging:

```typescript
// vite.config.ts
build: {
  sourcemap: true, // or 'inline' for development
}
```

## Testing

### E2E Testing with Playwright

Comprehensive E2E test suite:

```bash
# Run all tests
npm run test:e2e

# Run specific test file
npx playwright test tests/map.spec.ts

# Run tests matching a pattern
npx playwright test -g "should create alert"
```

**Best practices:**
- Test user workflows, not implementation
- Use data-testid for reliable selectors
- Mock external APIs when appropriate
- Keep tests independent and isolated

See `E2E_TESTING_README.md` for complete testing guide.

### Manual Testing Checklist

Before releasing:
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on mobile (iOS Safari, Chrome Android)
- [ ] Test with Mapbox token
- [ ] Test without Mapbox token
- [ ] Test offline functionality (PWA)
- [ ] Test in different languages
- [ ] Test authentication flow
- [ ] Test alert creation
- [ ] Test map interactions
- [ ] Test responsive design

## Code Style

### TypeScript

Follow TypeScript best practices:

```typescript
// Use interfaces for object shapes
interface Alert {
  id: string;
  name: string;
  coordinates: [number, number];
}

// Use types for unions and primitives
type Status = 'pending' | 'active' | 'resolved';

// Prefer const assertions
const COLORS = ['red', 'blue', 'green'] as const;

// Use unknown instead of any
function handleError(error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  }
}
```

### React Components

Follow React best practices:

```typescript
// Functional components with TypeScript
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({
  onClick,
  children,
  variant = 'primary'
}: ButtonProps) {
  return (
    <button onClick={onClick} className={variant}>
      {children}
    </button>
  );
}

// Use hooks at the top level
function MyComponent() {
  const [state, setState] = useState(0);
  const value = useMemo(() => expensive(state), [state]);

  // Not inside conditionals or loops
  if (condition) {
    // ❌ Don't put hooks here
  }

  return <div>{value}</div>;
}
```

### CSS/Tailwind

Use Tailwind utility classes:

```tsx
// Good: Utility classes
<div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow">

// Avoid: Custom CSS unless necessary
<div className="custom-container">
```

**Responsive design:**
```tsx
<div className="text-sm md:text-base lg:text-lg">
  Responsive text size
</div>
```

## Git Workflow

### Commit Messages

Follow conventional commits:

```
feat: add new map layer toggle
fix: resolve marker positioning issue
docs: update README with new examples
style: format code with prettier
refactor: simplify API service
test: add E2E tests for alert creation
chore: update dependencies
```

### Branch Naming

```
feature/description  # New features
fix/description      # Bug fixes
docs/description     # Documentation updates
refactor/description # Code refactoring
test/description     # Test additions
```

### Pre-commit Hooks

Husky runs checks before each commit:

```bash
# Configured in package.json
"lint-staged": {
  "*.{ts,tsx}": [
    "eslint --fix",
    "bash -c 'tsc --noEmit'"
  ]
}
```

**What happens on commit:**
1. ESLint checks and fixes code
2. TypeScript type checking
3. If any checks fail, commit is aborted

**To bypass hooks** (not recommended):
```bash
git commit --no-verify -m "message"
```

## Adding New Dependencies

### Installing Packages

```bash
# Production dependency
npm install package-name

# Development dependency
npm install -D package-name
```

### Dependency Guidelines

**Before adding a dependency:**
1. Check bundle size impact
2. Verify it's actively maintained
3. Check for security vulnerabilities
4. Consider if functionality can be implemented simply without it

**Useful tools:**
- [Bundlephobia](https://bundlephobia.com/) - Check package size
- [npm trends](https://npmtrends.com/) - Compare package popularity
- [Snyk](https://snyk.io/) - Security vulnerability scanning

## Internationalization

### Adding New Translations

1. **Update English source:**
```json
// src/i18n/locales/en.json
{
  "new_key": "New text to translate"
}
```

2. **Generate all translations:**
```bash
npm run translate:all
```

3. **Review generated translations** and adjust if needed

4. **Use in components:**
```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <p>{t('new_key')}</p>;
}
```

### Translation Best Practices

```typescript
// ✅ Good: Use interpolation for variables
t('welcome_message', { name: 'John' })
// "Welcome, John!"

// ✅ Good: Separate plurals
t('items_count', { count: 5 })
// Handles singular/plural automatically

// ❌ Bad: String concatenation
`Welcome, ${name}!`
// Doesn't work with translations
```

## Contributing

We welcome contributions! Please:

1. **Fork the repository**
2. **Create a feature branch** from `main`
3. **Make your changes** following this guide
4. **Write tests** if applicable
5. **Update documentation** if needed
6. **Submit a pull request**

### Pull Request Process

1. Ensure all tests pass
2. Update README if needed
3. Add description of changes
4. Request review from maintainers
5. Address review feedback
6. Merge after approval

## Resources

### Documentation
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)

### Tools
- [VS Code](https://code.visualstudio.com/) - Recommended editor
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Postman](https://www.postman.com/) - API testing
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance auditing

## Next Steps

- [Configuration Guide](./CONFIGURATION.md) - Environment setup
- [Deployment Guide](./DEPLOYMENT.md) - Deploy to production
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues
- [Tech Stack](./TECH_STACK.md) - Technology details
