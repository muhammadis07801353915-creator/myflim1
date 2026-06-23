const { Jimp } = require('jimp');

async function convert() {
  const image = await Jimp.read('assets/splash-icon.png');
  await image.write('assets/splash-icon.png');
  console.log('Converted successfully to true PNG!');
}

convert();
