const fs = require('fs');
const path = require('path');

const files = {
  'ckb.ts': { exchangeRates: 'نرخی دراوەکان' },
  'ku.ts': { exchangeRates: 'بهایێ دراڤان' },
  'ar.ts': { exchangeRates: 'أسعار العملات' },
  'en.ts': { exchangeRates: 'Exchange Rates' }
};

Object.keys(files).forEach(file => {
  const p = path.join('src/i18n/translations', file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    if (!content.includes('exchangeRates:')) {
      content = content.replace(/languageSelect:\s*"(.*?)",/, `languageSelect: "$1",\n    exchangeRates: "${files[file].exchangeRates}",`);
      fs.writeFileSync(p, content);
      console.log('Updated', file);
    } else {
      console.log(file, 'already has exchangeRates');
    }
  }
});
