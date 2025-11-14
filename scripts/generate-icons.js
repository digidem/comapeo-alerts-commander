#!/usr/bin/env node
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = join(__dirname, '..', 'public');
const iconSvg = join(publicDir, 'icon.svg');

async function generateIcons() {
  console.log('Generating PWA icons from icon.svg...\n');

  const svgBuffer = readFileSync(iconSvg);

  for (const size of sizes) {
    const outputPath = join(publicDir, `icon-${size}.png`);

    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`✓ Generated ${size}x${size} → icon-${size}.png`);
  }

  // Also generate favicon
  const faviconPath = join(publicDir, 'favicon.ico');
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(faviconPath);

  console.log('✓ Generated 32x32 → favicon.ico');

  console.log('\n✅ All icons generated successfully!');
  console.log('\n📝 To use your own logo:');
  console.log('   1. Replace public/icon.svg with your logo');
  console.log('   2. Run: npm run generate:icons');
  console.log('   3. All icon sizes will be regenerated automatically\n');
}

generateIcons().catch(console.error);
