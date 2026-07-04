const fs = require('fs');

const fileNames = ['ckb.ts', 'ar.ts', 'en.ts', 'ku.ts'];
for(const f of fileNames) {
  const path = 'src/i18n/translations/' + f;
  let content = fs.readFileSync(path, 'utf8');
  
  if (f === 'ckb.ts') {
    content = content.replace(/chooseCity:\s*['"]شار هەڵبژێرە['"]/, "chooseCity: 'ناوچە هەڵبژێرە'");
    content = content.replace(/city:\s*['"]شار['"]/, "city: 'ناوچە'");
    content = content.replace(/govAndCity:\s*['"]پارێزگا و شار['"]/, "govAndCity: 'پارێزگا و ناوچە'");
  } else if (f === 'ar.ts') {
    content = content.replace(/chooseCity:\s*['"]اختر المدينة['"]/, "chooseCity: 'اختر المنطقة'");
    content = content.replace(/city:\s*['"]المدينة['"]/, "city: 'المنطقة'");
    content = content.replace(/govAndCity:\s*['"]المحافظة والمدينة['"]/, "govAndCity: 'المحافظة والمنطقة'");
  } else if (f === 'en.ts') {
    content = content.replace(/chooseCity:\s*['"]Choose City['"]/, "chooseCity: 'Choose Region/Area'");
    content = content.replace(/city:\s*['"]City['"]/, "city: 'Region/Area'");
    content = content.replace(/govAndCity:\s*['"]Governorate and City['"]/, "govAndCity: 'Governorate and Region/Area'");
  } else if (f === 'ku.ts') {
    content = content.replace(/chooseCity:\s*['"]Bajar hilbijêre['"]/, "chooseCity: 'Devar hilbijêre'");
    content = content.replace(/city:\s*['"]Bajar['"]/, "city: 'Devar'");
    content = content.replace(/govAndCity:\s*['"]Parêzgeh û Bajar['"]/, "govAndCity: 'Parêzgeh û Devar'");
  }

  fs.writeFileSync(path, content);
}
console.log('Done updating city to region');
