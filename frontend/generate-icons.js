/**
 * PWA Icon Generator
 *
 * This script generates placeholder PWA icons in various sizes.
 * Replace these with your actual app icons/logo for production.
 *
 * Usage: node generate-icons.js
 *
 * For production, use proper icon generation tools like:
 * - https://realfavicongenerator.net/
 * - https://www.pwabuilder.com/
 * - Adobe Illustrator/Figma export
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create SVG icon (you can customize this)
function createSVGIcon(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Gradient Background -->
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#grad1)" rx="${size * 0.15}"/>

  <!-- FX Text -->
  <text x="50%" y="45%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.35}" font-weight="bold" fill="#ffffff">FX</text>

  <!-- Metrics Text -->
  <text x="50%" y="75%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.12}" font-weight="500" fill="#ffffff" opacity="0.9">METRICS</text>

  <!-- Trading Chart Line (Simple) -->
  <path d="M ${size * 0.15} ${size * 0.85} L ${size * 0.3} ${size * 0.78} L ${size * 0.45} ${size * 0.82} L ${size * 0.6} ${size * 0.75} L ${size * 0.75} ${size * 0.8} L ${size * 0.85} ${size * 0.72}"
        stroke="#ffffff" stroke-width="${size * 0.015}" fill="none" opacity="0.6"/>
</svg>`;
}

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('🎨 Generating PWA icons...\n');

// Generate icons
sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = `icon-${size}x${size}.png`;
  const svgFilename = `icon-${size}x${size}.svg`;
  const filepath = path.join(publicDir, svgFilename);

  // Save SVG file
  fs.writeFileSync(filepath, svgContent);
  console.log(`✓ Generated ${svgFilename}`);
});

console.log('\n📱 Icon generation complete!');
console.log('\nℹ️  Note: SVG files have been generated.');
console.log('   For production, convert these to PNG using:');
console.log('   1. Online tools like https://svgtopng.com/');
console.log('   2. Or use ImageMagick: convert icon.svg icon.png');
console.log('   3. Or use a design tool like Figma/Illustrator\n');

// Generate placeholder screenshots info
console.log('📸 Screenshot placeholders needed:');
console.log('   - screenshot-wide.png (1280x720) - Desktop view');
console.log('   - screenshot-narrow.png (750x1334) - Mobile view');
console.log('   Take actual screenshots of your app for these!\n');

// Create a simple README for icons
const readme = `# PWA Icons

## Current Status
The icon files have been generated as SVG placeholders.

## Production Setup

### 1. Convert SVG to PNG
Convert all SVG icons to PNG format:
- Use online tools: https://svgtopng.com/
- Use ImageMagick: \`convert icon-72x72.svg icon-72x72.png\`
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
`;

fs.writeFileSync(path.join(publicDir, 'ICONS-README.md'), readme);
console.log('✓ Created ICONS-README.md with instructions\n');
console.log('🎯 Next steps:');
console.log('   1. Convert SVG icons to PNG format');
console.log('   2. Take screenshots of your app');
console.log('   3. Replace placeholder icons with your branding');
console.log('   4. Test PWA installation\n');
