const { Jimp } = require('jimp');

async function convert(path) {
  try {
    const image = await Jimp.read(path);
    await image.write(path);
    console.log('Converted:', path);
  } catch (e) {
    console.error('Failed to convert', path, e);
  }
}

async function run() {
  await convert('assets/logo.png');
  await convert('src/assets/engine_icon.png');
  await convert('src/assets/gear_icon.png');
}

run();
