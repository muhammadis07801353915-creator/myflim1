const { Jimp } = require('jimp');
const path = require('path');

async function processIcon() {
  try {
    const inputPath = 'C:\\Users\\muham\\Downloads\\Telegram Desktop\\IMG_20260703_134530_217.jpg';
    const assetsDir = path.join(__dirname, 'assets');
    
    console.log('Reading image...');
    const image = await Jimp.read(inputPath);
    
    console.log('Generating icon.png (1024x1024)...');
    const iconImage = image.clone();
    iconImage.resize({ w: 1024, h: 1024 }); 
    await iconImage.write('assets/icon.png');
    
    console.log('Generating adaptive-icon.png (1080x1080)...');
    const adaptiveImage = image.clone();
    adaptiveImage.resize({ w: 1080, h: 1080 });
    await adaptiveImage.write('assets/adaptive-icon.png');
    
    console.log('Generating splash-icon.png (1024x1024)...');
    const splashImage = image.clone();
    splashImage.resize({ w: 1024, h: 1024 });
    await splashImage.write('assets/splash-icon.png');

    console.log('Done!');
  } catch (error) {
    console.error('Error processing icon:', error);
  }
}

processIcon();
