const { Jimp, rgbaToInt } = require('jimp');
const path = require('path');

async function processIcon() {
  try {
    const inputPath = 'C:\\Users\\muham\\Downloads\\Telegram Desktop\\IMG_20260703_134530_217.jpg';
    const assetsDir = path.join(__dirname, 'assets');
    
    console.log('Reading original image...');
    const original = await Jimp.read(inputPath);
    
    // Get the background color from the top-left pixel (to match the red exactly)
    const bgColor = original.getPixelColor(10, 10);
    
    console.log('Generating adaptive-icon.png (padded)...');
    // We increase the size from 600 to 800 for a larger logo.
    const logoForAdaptive = original.clone();
    logoForAdaptive.resize({ w: 800, h: 800 });
    
    const adaptiveIcon = new Jimp({ width: 1080, height: 1080, color: bgColor });
    adaptiveIcon.composite(logoForAdaptive, 140, 140); // 1080 - 800 = 280 / 2 = 140
    await adaptiveIcon.write('assets/adaptive-icon.png');
    
    console.log('Generating icon.png (padded)...');
    const logoForIcon = original.clone();
    logoForIcon.resize({ w: 850, h: 850 });
    const standardIcon = new Jimp({ width: 1024, height: 1024, color: bgColor });
    standardIcon.composite(logoForIcon, 87, 87); // (1024 - 850) / 2 = 87
    await standardIcon.write('assets/icon.png');

    console.log('Generating splash-icon.png (padded)...');
    const logoForSplash = original.clone();
    logoForSplash.resize({ w: 700, h: 700 });
    const splashIcon = new Jimp({ width: 1024, height: 1024, color: bgColor });
    splashIcon.composite(logoForSplash, 162, 162); // (1024 - 700) / 2 = 162
    await splashIcon.write('assets/splash-icon.png');

    console.log('Done!');
  } catch (error) {
    console.error('Error processing icon:', error);
  }
}

processIcon();
