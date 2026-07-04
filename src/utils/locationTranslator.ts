export const locationTranslations: Record<string, Record<string, string>> = {
  // Governorates
  'هەولێر': { ar: 'أربيل', en: 'Erbil', ku: 'Hewlêr', ckb: 'هەولێر' },
  'سلێمانی': { ar: 'السليمانية', en: 'Sulaymaniyah', ku: 'Silêmanî', ckb: 'سلێمانی' },
  'دهۆک': { ar: 'دهوك', en: 'Duhok', ku: 'Duhok', ckb: 'دهۆک' },
  'کەرکوک': { ar: 'كركوك', en: 'Kirkuk', ku: 'Kerkûk', ckb: 'کەرکوک' },
  'هەڵەبجە': { ar: 'حلبجة', en: 'Halabja', ku: 'Helebce', ckb: 'هەڵەبجە' },
  'بەغداد': { ar: 'بغداد', en: 'Baghdad', ku: 'Bexda', ckb: 'بەغداد' },
  'نەینەوا': { ar: 'نينوى', en: 'Nineveh', ku: 'Neynewa', ckb: 'نەینەوا' },
  'بەسرە': { ar: 'البصرة', en: 'Basra', ku: 'Besre', ckb: 'بەسرە' },
  'بابل': { ar: 'بابل', en: 'Babil', ku: 'Babil', ckb: 'بابل' },
  'دیالە': { ar: 'ديالى', en: 'Diyala', ku: 'Diyale', ckb: 'دیالە' },
  'ئەنبار': { ar: 'الأنبار', en: 'Al Anbar', ku: 'Enbar', ckb: 'ئەنبار' },
  'نەجەف': { ar: 'النجف', en: 'Najaf', ku: 'Necef', ckb: 'نەجەف' },
  'کەربەلا': { ar: 'كربلاء', en: 'Karbala', ku: 'Kerbela', ckb: 'کەربەلا' },
  'واست': { ar: 'واسط', en: 'Wasit', ku: 'Wasit', ckb: 'واست' },
  'میسان': { ar: 'ميسان', en: 'Maysan', ku: 'Mîsan', ckb: 'میسان' },
  'موسەننا': { ar: 'المثنى', en: 'Al Muthanna', ku: 'Musenna', ckb: 'موسەننا' },
  'زیقار': { ar: 'ذي قار', en: 'Dhi Qar', ku: 'Zîqar', ckb: 'زیقار' },
  'قادسیە': { ar: 'القادسية', en: 'Al Qadisiyyah', ku: 'Qadisiye', ckb: 'قادسیە' },

  // Add more translations if necessary or map them dynamically
};

export function translateLocation(name: string, language: string): string {
  if (!name) return '';
  const translations = locationTranslations[name];
  if (translations && translations[language]) {
    return translations[language];
  }
  return name; // fallback to original
}
