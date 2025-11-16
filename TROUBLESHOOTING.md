# Troubleshooting Guide

This guide covers common issues you might encounter while using or developing CoMapeo Alerts Commander, along with their solutions.

## Table of Contents

- [Map Issues](#map-issues)
- [Location Search Issues](#location-search-issues)
- [PWA & Icon Issues](#pwa--icon-issues)
- [Build & Performance Issues](#build--performance-issues)
- [Authentication Issues](#authentication-issues)
- [Development Issues](#development-issues)
- [Deployment Issues](#deployment-issues)

## Map Issues

### Map not loading or shows blank screen

**Symptoms:**
- White/gray screen where map should be
- Console shows "Failed to initialize map"

**Solutions:**

1. **Check internet connectivity:**
   - Maps require internet connection for first load
   - Tiles are cached after first load for offline use

2. **Verify Mapbox token (if using):**
   ```bash
   # Check your .env file
   cat .env
   # Should show: VITE_MAPBOX_TOKEN=pk.xxxxx
   ```

   - Token should start with `pk.` (public token)
   - Verify token is valid at [Mapbox Account](https://account.mapbox.com/access-tokens/)
   - Check token has required scopes: `styles:read`, `fonts:read`, `datasets:read`

3. **Try without Mapbox token:**
   ```bash
   # Remove or comment out token in .env
   # VITE_MAPBOX_TOKEN=

   # Rebuild the app
   npm run build
   ```

   The app should fall back to OpenStreetMap.

4. **Check browser console:**
   - Open DevTools (F12)
   - Look for specific error messages
   - Common errors:
     - "401 Unauthorized" → Invalid Mapbox token
     - "Network error" → Connectivity issue
     - "WebGL not supported" → Browser compatibility issue

5. **Verify WebGL support:**
   - Visit [WebGL Test](https://get.webgl.org/)
   - Both WebGL 1 and 2 should work
   - If not supported, update browser or graphics drivers

### Map markers not appearing

**Symptoms:**
- Map loads but alert markers don't show
- Console shows no errors

**Solutions:**

1. **Check if project has alerts:**
   - Switch to different project
   - Create a test alert to verify functionality

2. **Verify map zoom level:**
   - Markers might be outside current view
   - Use browser console to check:
   ```javascript
   // In browser console
   console.log('Map center:', map.getCenter());
   console.log('Map zoom:', map.getZoom());
   ```

3. **Check marker layer:**
   - Markers should be added after map loads
   - Look for "Map loaded" in console
   - Check if `useMapAlerts` hook is being called

4. **Clear cache and reload:**
   ```bash
   # Hard reload
   Ctrl+Shift+R (Windows/Linux)
   Cmd+Shift+R (Mac)
   ```

### Map shows wrong location

**Symptoms:**
- Default view is incorrect
- Coordinates are reversed (lat/lon swap)

**Solutions:**

1. **Check coordinate format:**
   - Map uses `[longitude, latitude]` format
   - Not `[latitude, longitude]`
   - Example: `[-74.5, 40]` is correct for New York

2. **Update default map config:**
   ```typescript
   // src/components/MapInterface.tsx
   const DEFAULT_MAP_CONFIG = {
     center: [-74.5, 40], // [longitude, latitude]
     zoom: 9,
   };
   ```

3. **Verify alert coordinates:**
   - Check API responses in Network tab
   - Ensure coordinates are in correct order

## Location Search Issues

### Search not returning results

**Symptoms:**
- Search bar doesn't return any locations
- "No results found" message

**Solutions:**

1. **With Mapbox token:**
   - Verify token has `geocoding:read` scope
   - Check Mapbox account usage limits
   - Try a simple query like "New York"

2. **Without Mapbox token (Nominatim):**
   - Check rate limit (1 request/second)
   - Wait a moment between searches
   - Try more specific search terms
   - Example: "Central Park, New York" instead of "park"

3. **Network issues:**
   - Check browser Network tab
   - Look for 429 (rate limit) or 403 (forbidden) errors
   - Verify CORS headers if using custom geocoding API

### Search results are inaccurate

**Symptoms:**
- Results don't match search query
- Wrong locations returned

**Solutions:**

1. **Be more specific:**
   - Include city/country: "Times Square, New York, USA"
   - Use full names: "Avenue" instead of "Ave"

2. **Check language settings:**
   - Some geocoding services work better in English
   - Try switching language to English temporarily

3. **Use coordinates directly:**
   - Click on map to select location
   - Or use manual coordinate entry
   - Format: `40.7128, -74.0060`

## PWA & Icon Issues

### Icons not updating after replacement

**Symptoms:**
- Old icons still showing after running `generate:icons`
- Browser shows cached icons

**Solutions:**

1. **Clear browser cache:**
   ```bash
   # Hard reload
   Ctrl+Shift+R (Windows/Linux)
   Cmd+Shift+R (Mac)
   ```

2. **Verify icons were generated:**
   ```bash
   ls -la public/icon-*.png
   # Should show multiple icon files with recent timestamps
   ```

3. **Uninstall and reinstall PWA:**
   - Desktop: Browser settings → Apps → Uninstall
   - Mobile: Hold app icon → Remove → Reinstall from browser

4. **Check manifest.json:**
   ```bash
   cat public/manifest.json
   # Verify icon paths are correct
   ```

5. **Re-generate icons:**
   ```bash
   # Delete old icons
   rm public/icon-*.png

   # Generate new ones
   npm run generate:icons
   ```

### PWA not installable

**Symptoms:**
- No install button in browser
- "Add to Home Screen" option missing

**Solutions:**

1. **Verify HTTPS:**
   - PWAs require HTTPS (or localhost)
   - Check URL starts with `https://`
   - Use Cloudflare Pages or similar for deployment

2. **Check manifest.json:**
   ```bash
   # Verify manifest is valid
   cat public/manifest.json
   # Must have: name, short_name, start_url, display, icons
   ```

3. **Check service worker:**
   - Open DevTools → Application → Service Workers
   - Should show "activated and running"
   - If not, check browser console for errors

4. **Browser compatibility:**
   - Chrome/Edge: Full support
   - Firefox: Limited support
   - Safari iOS: Use "Add to Home Screen"
   - Safari macOS: Limited support

5. **Check PWA criteria:**
   - Visit `chrome://flags` → Enable PWA installation
   - Use [PWA Builder](https://www.pwabuilder.com/) to validate

### Service worker not registering

**Symptoms:**
- Service worker shows "redundant" or "error" in DevTools
- Console shows registration errors

**Solutions:**

1. **Verify service worker file:**
   ```bash
   # Check file exists
   ls public/sw.js

   # Check it's accessible
   curl http://localhost:8080/sw.js
   ```

2. **Check HTTPS requirement:**
   - Service workers require HTTPS (except localhost)
   - Verify you're using HTTPS or localhost

3. **Clear existing registrations:**
   ```javascript
   // In browser console
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(r => r.unregister());
   });
   ```

   Then reload the page.

4. **Check for errors:**
   - Open DevTools → Application → Service Workers
   - Look for error messages
   - Common issue: Syntax error in sw.js

5. **Update service worker version:**
   ```javascript
   // public/sw.js
   const CACHE_VERSION = 'v2'; // Increment this
   ```

## Build & Performance Issues

### Build warnings about chunk size

**Symptoms:**
- Warning: "Some chunks are larger than 500 kB"
- Specifically about map libraries

**This is normal!**

Map libraries (Mapbox/MapLibre) are legitimately large (~700KB). The app uses code splitting to load them separately, so it doesn't impact initial load time.

**To suppress warnings:**

```typescript
// vite.config.ts
build: {
  chunkSizeWarningLimit: 1000, // Increase limit
}
```

### Slow build times

**Symptoms:**
- `npm run build` takes several minutes
- Build seems stuck

**Solutions:**

1. **Use development build for testing:**
   ```bash
   npm run build:dev  # Faster, includes source maps
   ```

2. **Clear node_modules and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check system resources:**
   - Build requires ~2GB RAM
   - Close other applications
   - Check disk space

4. **Disable source maps (production):**
   ```typescript
   // vite.config.ts
   build: {
     sourcemap: false, // Faster builds
   }
   ```

### App is slow or laggy

**Symptoms:**
- Slow page loads
- Laggy interactions
- High memory usage

**Solutions:**

1. **Check bundle size:**
   ```bash
   npm run build
   # Look at chunk sizes in output
   ```

2. **Enable production mode:**
   - Ensure you're using `npm run build`, not `npm run build:dev`
   - Production builds are optimized and minified

3. **Clear browser cache:**
   - Old cached assets might conflict
   - Hard reload: Ctrl+Shift+R

4. **Check network tab:**
   - Large assets being downloaded?
   - API responses slow?
   - Too many requests?

5. **Reduce map markers:**
   - Limit displayed markers to 100
   - Implement clustering for many alerts (future feature)

6. **Check React DevTools Profiler:**
   - Identify slow components
   - Look for unnecessary re-renders

## Authentication Issues

### Authentication failing

**Symptoms:**
- "Invalid credentials" error
- "Unauthorized" error
- Can't log in

**Solutions:**

1. **Verify server URL:**
   - Include `https://`
   - No trailing slash
   - Example: `https://demo.comapeo.cloud` ✅
   - Wrong: `demo.comapeo.cloud` ❌

2. **Check bearer token:**
   - Token should be valid and not expired
   - Copy-paste carefully (no extra spaces)
   - Try generating a new token

3. **Test with demo server:**
   ```
   URL: https://demo.comapeo.cloud
   Token: [Ask server admin for valid token]
   ```

4. **Check CORS configuration:**
   - If using custom server, ensure CORS headers are set
   - See [CONFIGURATION.md](./CONFIGURATION.md) for details

5. **Clear stored credentials:**
   ```javascript
   // In browser console
   localStorage.clear();
   sessionStorage.clear();
   ```

   Then try logging in again.

### "Remember me" not working

**Symptoms:**
- Credentials not saved
- Have to log in every time

**Solutions:**

1. **Check browser settings:**
   - Ensure cookies/localStorage are enabled
   - Not in incognito/private mode

2. **Check browser console:**
   - Look for localStorage errors
   - Some browsers block localStorage in certain contexts

3. **Try different browser:**
   - Test if issue is browser-specific

## Development Issues

### Dev server not starting

**Symptoms:**
- `npm run dev` fails
- Port already in use error

**Solutions:**

1. **Check if port 8080 is in use:**
   ```bash
   # Linux/Mac
   lsof -ti:8080

   # Windows
   netstat -ano | findstr :8080
   ```

2. **Kill process using port:**
   ```bash
   # Linux/Mac
   kill -9 $(lsof -ti:8080)

   # Windows
   taskkill /PID <PID> /F
   ```

3. **Use different port:**
   ```typescript
   // vite.config.ts
   server: {
     port: 3000, // Change port
   }
   ```

4. **Check Node.js version:**
   ```bash
   node --version
   # Should be 18 or higher
   ```

### Hot Module Replacement (HMR) not working

**Symptoms:**
- Changes don't appear without full reload
- Have to manually refresh browser

**Solutions:**

1. **Check file watcher limits (Linux):**
   ```bash
   # Increase limit
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

2. **Restart dev server:**
   ```bash
   # Stop with Ctrl+C
   # Start again
   npm run dev
   ```

3. **Check for syntax errors:**
   - HMR stops working after syntax errors
   - Fix errors and save again

### TypeScript errors

**Symptoms:**
- Build fails with TypeScript errors
- "Type 'X' is not assignable to type 'Y'"

**Solutions:**

1. **Run type checker:**
   ```bash
   npx tsc --noEmit
   # Shows all type errors
   ```

2. **Common fixes:**
   ```typescript
   // Add proper types
   const data: MyType = fetchData();

   // Use type assertion (only if you're sure)
   const element = document.getElementById('id') as HTMLElement;

   // Handle null/undefined
   const value = maybeNull ?? 'default';
   ```

3. **Update TypeScript:**
   ```bash
   npm install -D typescript@latest
   ```

### ESLint errors

**Symptoms:**
- Commit blocked by pre-commit hook
- Linter errors in editor

**Solutions:**

1. **Run linter manually:**
   ```bash
   npm run lint
   ```

2. **Auto-fix issues:**
   ```bash
   npm run lint -- --fix
   ```

3. **Common issues:**
   - Unused variables: Remove them or prefix with `_`
   - Missing dependencies in hooks: Add to dependency array
   - Console statements: Remove or use `// eslint-disable-next-line`

## Deployment Issues

### Cloudflare Pages build failing

**Symptoms:**
- GitHub Action fails
- Build succeeds locally but fails in CI

**Solutions:**

1. **Check build logs:**
   - Go to GitHub Actions tab
   - Click on failed workflow
   - Read error messages

2. **Verify environment variables:**
   - Go to Cloudflare Pages dashboard
   - Settings → Environment variables
   - Add `VITE_MAPBOX_TOKEN` if needed

3. **Check Node.js version:**
   - Cloudflare might use different Node version
   - Specify in `package.json`:
   ```json
   "engines": {
     "node": ">=18.0.0"
   }
   ```

4. **Test production build locally:**
   ```bash
   npm run build
   # Should succeed without errors
   ```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment troubleshooting.

### Docker build failing

**Symptoms:**
- `docker build` fails
- Container won't start

**Solutions:**

1. **Check Dockerfile syntax:**
   ```bash
   docker build --no-cache -t test .
   # Look for specific error
   ```

2. **Verify build context:**
   ```bash
   # Ensure you're in project root
   ls Dockerfile
   # Should exist
   ```

3. **Check Docker version:**
   ```bash
   docker --version
   # Should be 20.10 or higher
   ```

4. **Clear Docker cache:**
   ```bash
   docker system prune -a
   ```

See [DOCKER.md](./DOCKER.md) for detailed Docker troubleshooting.

## Getting More Help

If you're still experiencing issues:

1. **Check existing issues:**
   - Visit GitHub Issues page
   - Search for similar problems
   - Check closed issues too

2. **Create a new issue:**
   - Provide detailed description
   - Include error messages
   - Share browser/OS information
   - Describe steps to reproduce

3. **Gather information:**
   ```bash
   # System info
   node --version
   npm --version

   # Browser console errors
   # Screenshot or copy error messages

   # Build output
   npm run build 2>&1 | tee build.log
   ```

4. **Community resources:**
   - Check CoMapeo documentation
   - Vite troubleshooting guide
   - React documentation

## Quick Diagnostics

Run this checklist to quickly diagnose issues:

```bash
# 1. Check versions
node --version  # Should be 18+
npm --version   # Should be 9+

# 2. Verify installation
npm install

# 3. Check for errors
npm run lint

# 4. Try building
npm run build

# 5. Test locally
npm run preview

# 6. Check environment
cat .env  # Verify settings

# 7. Clear cache
rm -rf node_modules package-lock.json
npm install
```

## Preventive Measures

To avoid issues:

1. **Keep dependencies updated:**
   ```bash
   npm outdated
   npm update
   ```

2. **Use recommended Node.js version:**
   - Node.js 18 LTS or higher
   - Use [nvm](https://github.com/nvm-sh/nvm) to manage versions

3. **Commit working state often:**
   - Use git branches for experiments
   - Commit before major changes

4. **Test in production mode:**
   ```bash
   npm run build && npm run preview
   # Before deploying
   ```

5. **Monitor bundle size:**
   - Check build output regularly
   - Keep an eye on chunk sizes

## Still Need Help?

Contact the maintainers or community:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: [Full docs](./README.md)
- CoMapeo: [CoMapeo website](https://www.comapeo.cloud/)
