const fs = require('fs');
const path = require('path');

const files = {
  'ckb.ts': {
    title: 'پۆستەکانم',
    available: 'بەردەستە',
    pending: 'لە چاوەڕوانیدا',
    sold: 'فرۆشرا',
    edit: 'دەستکاری',
    noPosts: 'هیچ پۆستێکت نییە بەم بارەیەوە',
  },
  'ku.ts': {
    title: 'پۆستێن من',
    available: 'بەردەستە',
    pending: 'ل هیڤیێ',
    sold: 'هاتە فرۆتن',
    edit: 'دەستکاری',
    noPosts: 'چ پۆست نەهاتن دیتن',
  },
  'ar.ts': {
    title: 'إعلاناتي',
    available: 'متاح',
    pending: 'قيد الانتظار',
    sold: 'تم البيع',
    edit: 'تعديل',
    noPosts: 'لا توجد إعلانات',
  },
  'en.ts': {
    title: 'My Posts',
    available: 'Available',
    pending: 'Pending',
    sold: 'Sold',
    edit: 'Edit',
    noPosts: 'No posts found',
  }
};

Object.keys(files).forEach(file => {
  const p = path.join('src/i18n/translations', file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    if (!content.includes('posts: {')) {
      // insert before final export default
      const add = `\n  posts: {\n    title: '${files[file].title}',\n    available: '${files[file].available}',\n    pending: '${files[file].pending}',\n    sold: '${files[file].sold}',\n    edit: '${files[file].edit}',\n    noPosts: '${files[file].noPosts}',\n  },\n`;
      content = content.replace(/export default {/, `export default {${add}`);
      fs.writeFileSync(p, content);
      console.log('Updated', file);
    } else {
      console.log(file, 'already has posts');
    }
  }
});
