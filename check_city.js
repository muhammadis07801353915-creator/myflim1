const fs = require('fs');

for (const f of ['ar.ts', 'en.ts', 'ku.ts']) {
  const content = fs.readFileSync('src/i18n/translations/' + f, 'utf8');
  const companySection = content.indexOf('companyAccount:');
  if (companySection !== -1) {
    const section = content.slice(companySection, companySection + 1000);
    const cityLine = section.match(/city['":]?\s*:\s*.+/g);
    const govCityLine = section.match(/govAndCity.+/g);
    const chooseCityLine = section.match(/chooseCity.+/g);
    console.log(f, { cityLine, govCityLine, chooseCityLine });
  } else {
    console.log(f, 'no companyAccount section');
  }
}
