const sharp = require('sharp');
const path = require('path');

async function processIcons() {
  const inputPath = path.join(__dirname, '../myflim-expo/assets/app-logo-new.png');
  const assetsDir = path.join(__dirname, '../myflim-expo/assets');

  // Resize logo to 620x620 (approx 60% of 1024) for safe padding
  const scaledLogoBuffer = await sharp(inputPath)
    .resize(620, 620, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // 1. Create transparent Adaptive Foreground Icon (1024x1024 with 620x620 logo centered)
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: scaledLogoBuffer, gravity: 'center' }])
    .png()
    .toFile(path.join(assetsDir, 'adaptive-icon.png'));

  // 2. Create Icon / App Logo with White background (1024x1024 with 620x620 logo centered)
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([{ input: scaledLogoBuffer, gravity: 'center' }])
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));

  // Also copy to app-logo-new.png
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([{ input: scaledLogoBuffer, gravity: 'center' }])
    .png()
    .toFile(path.join(assetsDir, 'app-logo-new.png'));

  console.log('App icons successfully generated with 25% padding!');
}

processIcons().catch(console.error);
