# PWA Icons Guide

This project uses a simple red circle as the default icon. You can easily replace it with your own logo.

## Quick Start: Replace Icons

1. **Replace the source icon:**
   ```bash
   # Replace public/icon.svg with your logo
   # Make sure your logo is an SVG file
   cp /path/to/your/logo.svg public/icon.svg
   ```

2. **Generate all icon sizes:**
   ```bash
   npm run generate:icons
   ```

3. **Done!** All icon sizes (72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512) will be automatically generated from your SVG.

## Icon Requirements

### For Best Results:
- **Format:** SVG (recommended) or high-resolution PNG (minimum 512x512)
- **Aspect Ratio:** Square (1:1)
- **Safe Area:** Keep important elements within the center 80% of the icon
- **Transparent Background:** Recommended for better display across different platforms
- **Simple Design:** Icons look best when simple and recognizable at small sizes

### Why SVG?
Using SVG as the source ensures:
- Perfect scaling to any size
- Smaller file sizes
- Easy to edit and modify
- No quality loss when generating different sizes

## Manual Icon Generation

If you prefer to create icons manually (not recommended):

1. Create PNG files in the following sizes:
   - icon-72.png (72x72)
   - icon-96.png (96x96)
   - icon-128.png (128x128)
   - icon-144.png (144x144)
   - icon-152.png (152x152)
   - icon-192.png (192x192)
   - icon-384.png (384x384)
   - icon-512.png (512x512)
   - favicon.ico (32x32)

2. Place all files in the `public/` directory

3. Update the service worker cache version in `public/sw.js` to force update:
   ```javascript
   const CACHE_NAME = "comapeo-alert-v3"; // Increment version
   ```

## Icon Locations

Icons are used in several places:

- **Manifest:** `public/manifest.json` - Defines all icon sizes for PWA
- **HTML Head:** `index.html` - Links to icons for browsers and devices
- **Service Worker:** `public/sw.js` - Caches icons for offline use
- **Shortcuts:** `public/manifest.json` - Icons for app shortcuts

## Testing Your Icons

After replacing icons:

1. **Clear browser cache:**
   - Chrome: DevTools > Application > Storage > Clear site data
   - Firefox: DevTools > Storage > Clear All
   - Safari: Develop > Empty Caches

2. **Test PWA installation:**
   - Desktop: Look for install button in browser address bar
   - Mobile: Use browser's "Add to Home Screen" option

3. **Verify icon appearance:**
   - Check home screen icon after installation
   - Check browser tab favicon
   - Check PWA splash screen (mobile)

## Current Icon

The default icon is a simple red circle (`#ef4444`):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <circle cx="256" cy="256" r="256" fill="#ef4444"/>
</svg>
```

This matches the red color used for alert markers in the app, providing visual consistency.

## Troubleshooting

**Icons not updating after replacement?**
- Clear browser cache
- Hard reload (Ctrl+Shift+R or Cmd+Shift+R)
- Uninstall and reinstall PWA
- Check browser console for errors

**Icons look blurry?**
- Ensure source SVG is high quality
- Check that generated PNGs are the correct sizes
- Verify SVG viewBox is set correctly (should be "0 0 512 512")

**PWA not installable?**
- Verify all icon sizes are present
- Check manifest.json is valid (use Chrome DevTools)
- Ensure HTTPS is enabled (required for PWA)
- Check service worker is registered successfully
