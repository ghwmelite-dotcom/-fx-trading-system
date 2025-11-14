# PWA Icons

## Current Status
The icon files have been generated as SVG placeholders.

## Production Setup

### 1. Convert SVG to PNG
Convert all SVG icons to PNG format:
- Use online tools: https://svgtopng.com/
- Use ImageMagick: `convert icon-72x72.svg icon-72x72.png`
- Use design software (Figma, Adobe Illustrator)

### 2. Create Professional Icons
For a professional app, create custom icons:
1. Design a logo in your design tool
2. Export in all required sizes (72, 96, 128, 144, 152, 192, 384, 512)
3. Ensure icons are square and have rounded corners if desired
4. Test on both light and dark backgrounds

### 3. Screenshot Requirements
Create two screenshots:
- **screenshot-wide.png**: 1280x720px (desktop/tablet view)
- **screenshot-narrow.png**: 750x1334px (mobile view)

Take actual screenshots of your app in use!

### 4. Testing Icons
Test your icons:
1. Run your app in dev mode
2. Open DevTools → Application → Manifest
3. Check that all icons load correctly
4. Test install on real devices

## Icon Sizes Explained
- 72x72: Small Android devices
- 96x96: Android devices
- 128x128: Small Chrome app icon
- 144x144: Microsoft Tiles
- 152x152: iOS devices
- 192x192: Standard Android icon
- 384x384: Large icon
- 512x512: Splash screens

## Resources
- PWA Icon Generator: https://realfavicongenerator.net/
- PWA Builder: https://www.pwabuilder.com/
- Maskable Icon Editor: https://maskable.app/
