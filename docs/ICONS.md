# PWA Icons Setup

To complete the PWA setup, you need to create icon files for the app.

## Required Icons

The app requires the following icon files in the `public/` directory:

- `icon-192.png` - 192x192 pixels
- `icon-512.png` - 512x512 pixels

## Creating Icons

### Option 1: Using Online Tools

1. Create a logo/icon design (192x192 and 512x512)
2. Use tools like:
   - [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
   - [RealFaviconGenerator](https://realfavicongenerator.net/)
   - [Favicon.io](https://favicon.io/)

### Option 2: Manual Creation

1. Design your icon in a graphics editor (Figma, Photoshop, etc.)
2. Export as PNG with the required dimensions
3. Place files in `public/` directory

## Icon Guidelines

- Use a simple, recognizable design
- Ensure good contrast for visibility
- Test on both light and dark backgrounds
- Follow platform guidelines (iOS, Android)

## Temporary Solution

For development, you can use placeholder icons:

```bash
# Create simple colored squares as placeholders
# Replace with actual icons before production
```

## Apple Touch Icon

The app also references `/icon-192.png` as the Apple touch icon in the layout.

## Updating Icons

After adding icons:
1. Clear browser cache
2. Unregister service worker (if installed)
3. Reinstall PWA to see new icons

