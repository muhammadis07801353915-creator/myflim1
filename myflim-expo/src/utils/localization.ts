export const translateCategoryName = (catName: string, lang: string): string => {
  if (!catName) return '';
  const key = catName.trim().toLowerCase();
  
  const map: Record<string, { ku: string; badini: string; ar: string; en: string }> = {
    'news': { ku: 'هەواڵ', badini: 'هەواڵ', ar: 'الأخبار', en: 'News' },
    'هەواڵ': { ku: 'هەواڵ', badini: 'هەواڵ', ar: 'الأخبار', en: 'News' },
    'الأخبار': { ku: 'هەواڵ', badini: 'هەواڵ', ar: 'الأخبار', en: 'News' },

    'kids': { ku: 'منداڵان', badini: 'زافۆک', ar: 'أطفال', en: 'Kids' },
    'منداڵان': { ku: 'منداڵان', badini: 'زافۆک', ar: 'أطفال', en: 'Kids' },
    'أطفال': { ku: 'منداڵان', badini: 'زافۆک', ar: 'أطفال', en: 'Kids' },

    'sports': { ku: 'وەرزش', badini: 'وەرزش', ar: 'رياضة', en: 'Sports' },
    'وەرزش': { ku: 'وەرزش', badini: 'وەرزش', ar: 'رياضة', en: 'Sports' },
    'رياضة': { ku: 'وەرزش', badini: 'وەرزش', ar: 'رياضة', en: 'Sports' },

    'entertainment': { ku: 'کەیف و خۆشی', badini: 'خۆشی', ar: 'ترفيه', en: 'Entertainment' },
    'کەیف و خۆشی': { ku: 'کەیف و خۆشی', badini: 'خۆشی', ar: 'ترفيه', en: 'Entertainment' },
    'خۆشی': { ku: 'کەیف و خۆشی', badini: 'خۆشی', ar: 'ترفيه', en: 'Entertainment' },
    'ترفيه': { ku: 'کەیف و خۆشی', badini: 'خۆشی', ar: 'ترفيه', en: 'Entertainment' },

    'movies': { ku: 'فیلمەکان', badini: 'فیلم', ar: 'أفلام', en: 'Movies' },
    'فیلمەکان': { ku: 'فیلمەکان', badini: 'فیلم', ar: 'أفلام', en: 'Movies' },
    'أفلام': { ku: 'فیلمەکان', badini: 'فیلم', ar: 'أفلام', en: 'Movies' },

    'series': { ku: 'زنجیرەکان', badini: 'زنجیرە', ar: 'مسلسلات', en: 'Series' },
    'زنجیرەکان': { ku: 'زنجیرەکان', badini: 'زنجیرە', ar: 'مسلسلات', en: 'Series' },
    'مسلسلات': { ku: 'زنجیرەکان', badini: 'زنجیرە', ar: 'مسلسلات', en: 'Series' },

    'documentary': { ku: 'بەڵگەفیلم', badini: 'بەڵگەفیلم', ar: 'وثائقي', en: 'Documentary' },
    'بەڵگەفیلم': { ku: 'بەڵگەفیلم', badini: 'بەڵگەفیلم', ar: 'وثائقي', en: 'Documentary' },
    'وثائقي': { ku: 'بەڵگەفیلم', badini: 'بەڵگەفیلم', ar: 'وثائقي', en: 'Documentary' },

    'music': { ku: 'مۆسیقا', badini: 'مۆسیقا', ar: 'موسيقى', en: 'Music' },
    'مۆسیقا': { ku: 'مۆسیقا', badini: 'مۆسیقا', ar: 'موسيقى', en: 'Music' },
    'موسيقى': { ku: 'مۆسیقا', badini: 'مۆسیقا', ar: 'موسيقى', en: 'Music' },

    'religious': { ku: 'ئایینی', badini: 'ئایینی', ar: 'ديني', en: 'Religious' },
    'ئایینی': { ku: 'ئایینی', badini: 'ئایینی', ar: 'ديني', en: 'Religious' },
    'ديني': { ku: 'ئایینی', badini: 'ئایینی', ar: 'ديني', en: 'Religious' },

    'general': { ku: 'گشتی', badini: 'گشتی', ar: 'عام', en: 'General' },
    'گشتی': { ku: 'گشتی', badini: 'گشتی', ar: 'عام', en: 'General' },
    'عام': { ku: 'گشتی', badini: 'گشتی', ar: 'عام', en: 'General' },

    'local': { ku: 'خۆماڵی', badini: 'خۆماڵی', ar: 'محلي', en: 'Local' },
    'خۆماڵی': { ku: 'خۆماڵی', badini: 'خۆماڵی', ar: 'محلي', en: 'Local' },
    'محلي': { ku: 'خۆماڵی', badini: 'خۆماڵی', ar: 'محلي', en: 'Local' },
  };

  if (map[key]) {
    if (lang === 'ku') return map[key].ku;
    if (lang === 'badini') return map[key].badini;
    if (lang === 'ar') return map[key].ar;
    return map[key].en;
  }

  return catName;
};

export const getLocalized = (item: any, field: 'title' | 'description' | 'name', language: string) => {
  if (!item) return '';
  
  if (field === 'name') {
    const raw = item[`${field}_${language}`] || item[field] || '';
    return translateCategoryName(raw, language);
  }

  if (language === 'ku') {
    return item[`${field}_ku`] || item[field] || '';
  }
  if (language === 'badini') {
    return item[`${field}_badini`] || item[`${field}_ku`] || item[field] || '';
  }
  if (language === 'ar') {
    return item[`${field}_ar`] || item[field] || '';
  }
  
  return item[`${field}_en`] || item[field] || '';
};
