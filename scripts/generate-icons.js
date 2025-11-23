const fs = require('fs');
const path = require('path');

// Generate icons using sharp package
// Run: npm install sharp && node scripts/generate-icons.js

async function generateIcons() {
  try {
    // Try to use sharp if available
    const sharp = require('sharp');
    const publicDir = path.join(__dirname, '..', 'public');
    
    // Create SVG content for the icon
    const createSVG = (size) => `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#3b3b3b;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${size}" height="${size}" fill="url(#grad)"/>
        <text x="50%" y="50%" font-family="system-ui, -apple-system, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">DU</text>
      </svg>
    `;
    
    // Generate 192x192 icon
    const svg192 = Buffer.from(createSVG(192));
    await sharp(svg192)
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('✓ Generated icon-192.png');
    
    // Generate 512x512 icon
    const svg512 = Buffer.from(createSVG(512));
    await sharp(svg512)
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('✓ Generated icon-512.png');
    
    console.log('\n✅ All icons generated successfully!');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('\n❌ Error: sharp package not found.');
      console.log('\nPlease install sharp first:');
      console.log('  npm install sharp');
      console.log('\nThen run this script again:');
      console.log('  node scripts/generate-icons.js');
    } else {
      console.error('Error generating icons:', error);
    }
    process.exit(1);
  }
}

generateIcons();
