const fs = require('fs');

// The keys use double-quotes since they were injected via JSON.stringify
const changes = {
  'ar.ts': {
    '"city": "المدينة"': '"city": "المنطقة"',
    '"govAndCity": "المحافظة والمدينة"': '"govAndCity": "المحافظة والمنطقة"',
    '"chooseCity": "اختر المدينة"': '"chooseCity": "اختر المنطقة"',
  },
  'en.ts': {
    '"city": "City"': '"city": "Region/Area"',
    '"govAndCity": "Governorate and City"': '"govAndCity": "Governorate and Region/Area"',
    '"chooseCity": "Choose City"': '"chooseCity": "Choose Region/Area"',
  },
  'ku.ts': {
    '"city": "Bajar"': '"city": "Dewar"',
    '"govAndCity": "Parêzgeh û Bajar"': '"govAndCity": "Parêzgeh û Dewar"',
    '"chooseCity": "Bajar hilbijêre"': '"chooseCity": "Dewar hilbijêre"',
  },
};

for (const [file, replacements] of Object.entries(changes)) {
  let content = fs.readFileSync('src/i18n/translations/' + file, 'utf8');
  for (const [from, to] of Object.entries(replacements)) {
    if (content.includes(from)) {
      content = content.replace(from, to);
      console.log('Replaced in ' + file + ': ' + from + ' => ' + to);
    } else {
      console.log('Not found in ' + file + ': ' + from);
    }
  }
  fs.writeFileSync('src/i18n/translations/' + file, content);
}
console.log('Done!');
