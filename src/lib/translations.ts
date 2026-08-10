export type Language = 'en' | 'ku' | 'badini' | 'ar';

export interface Translations {
  profile: string;
  becomePro: string;
  activated: string;
  premiumFeatures: string;
  lightMode: string;
  darkMode: string;
  language: string;
  adminPanel: string;
  notifications: string;
  downloads: string;
  privacyPolicy: string;
  termsConditions: string;
  rateApp: string;
  logout: string;
  editName: string;
  save: string;
  cancel: string;
  logoutConfirm: string;
  home: string;
  search: string;
  liveTv: string;
  watchlist: string;
  movies: string;
  series: string;
  all: string;
  trending: string;
  popular: string;
  topRated: string;
  watchNow: string;
  addToWatchlist: string;
  removeFromWatchlist: string;
  episodes: string;
  season: string;
  category: string;
  viewAll: string;
  seeAll: string;
  searchChannels: string;
  noChannels: string;
  searchResults: string;
  close: string;
  comments: string;
  writeComment: string;
  loginToComment: string;
  noComments: string;
  loginRequired: string;
  loginToJoin: string;
  anonymousUser: string;
  like: string;
  reply: string;
  storyLine: string;
  seasons: string;
  episodesTitle: string;
  episode: string;
  socialMedia: string;
  noNotifications: string;
  pushNotice: string;
  generalNotice: string;
  enterCodeToUnlock: string;
  loadingTabanPlay: string;
  noContentAvailable: string;
  itemsCount: string;
}

export const commonNameTranslations: Record<string, Record<Language, string>> = {
  'All': { en: 'All', ku: 'هەمووی', badini: 'هەمی', ar: 'الكل' },
  'News': { en: 'News', ku: 'هەواڵ', badini: 'نۆچە', ar: 'الأخبار' },
  'Entertainment': { en: 'Entertainment', ku: 'بەکات بەسەربردن', badini: 'دەمبووراندن', ar: 'ترفيه' },
  'Kids': { en: 'Kids', ku: 'مناڵان', badini: 'زارۆک', ar: 'أطفال' },
  'Sports': { en: 'Sports', ku: 'وەرزش', badini: 'وەرزش', ar: 'رياضة' },
  'Movies': { en: 'Movies', ku: 'فیلمەکان', badini: 'فیلم', ar: 'أفلام' },
  'Series': { en: 'Series', ku: 'زنجیرەکان', badini: 'زنجیرە', ar: 'مسلسلات' },
  'Newest Added': { en: 'Newest Added', ku: 'نوێترین زیادکراو', badini: 'نوی‌ترین زێدەکری', ar: 'أحدث الإضافات' },
  'نوێترین زیادکراو': { en: 'Newest Added', ku: 'نوێترین زیادکراو', badini: 'نوی‌ترین زێدەکری', ar: 'أحدث الإضافات' },
  'فلیمی کوردی دۆبلاژ': { en: 'Kurdish Dubbed Movies', ku: 'فلیمی کوردی دۆبلاژ', badini: 'فیلمێن دۆبلاژکری یێن کوردی', ar: 'أفلام مدبلجة كوردية' },
  'زنجیرەی کوردی دۆبلاژ': { en: 'Kurdish Dubbed Series', ku: 'زنجیرەی کوردی دۆبلاژ', badini: 'زنجیرەیێن دۆبلاژکری یێن کوردی', ar: 'مسلسلات مدبلجة كوردية' },
  'فلیمی ژێرنووسکراو': { en: 'Kurdish Subtitled Movies', ku: 'فلیمی ژێرنووسکراو', badini: 'فیلمێن ژێرنووسکری یێن کوردی', ar: 'أفلام مترجمة كوردية' },
  'زنجیرەی ژێرنووسکراو': { en: 'Kurdish Subtitled Series', ku: 'زنجیرەی ژێرنووسکراو', badini: 'زنجیرەیێن ژێرنووسکری یێن کوردی', ar: 'مسلسلات مترجمة كوردية' },
  'Popular': { en: 'Top 250', ku: 'تۆپ 250', badini: 'تۆپ 250', ar: 'أفضل 250' },
  'Top Contents': { en: 'Top 250', ku: 'تۆپ 250', badini: 'تۆپ 250', ar: 'أفضل 250' },
  'تۆپ 250': { en: 'Top 250', ku: 'تۆپ 250', badini: 'تۆپ 250', ar: 'أفضل 250' },
  'ئەنیمەیشن': { en: 'Animation', ku: 'ئەنیمەیشن و کارتۆن', badini: 'ئەنیمەیشن و کارتۆن', ar: 'أنيميشن ورسوم متحركة' },
  'کارتۆن': { en: 'Cartoons', ku: 'کارتۆن', badini: 'کارتۆن', ar: 'رسوم متحركة' },
};

export const getLocalized = (item: any, field: 'title' | 'description' | 'name', language: string) => {
  if (!item) return '';
  
  if (typeof item === 'string') {
    if (commonNameTranslations[item]) {
      return commonNameTranslations[item][language as Language] || item;
    }
    return item;
  }
  
  const val = item[field] || '';
  if (val && commonNameTranslations[val]) {
    return commonNameTranslations[val][language as Language] || val;
  }

  if (language === 'ku') return item[field] || '';
  const localizedField = `${field}_${language}`;
  return item[localizedField] || item[field] || '';
};

export const translations: Record<Language, Translations> = {
  en: {
    profile: 'Profile',
    becomePro: 'Become a PRO',
    activated: 'Fully Activated',
    premiumFeatures: 'Unlock all premium features',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    language: 'Language',
    adminPanel: 'Admin Panel',
    notifications: 'Notifications',
    downloads: 'Downloads',
    privacyPolicy: 'Privacy Policy',
    termsConditions: 'Terms & Conditions',
    rateApp: 'Rate this app',
    logout: 'Log out',
    editName: 'Edit Name',
    save: 'Save',
    cancel: 'Cancel',
    logoutConfirm: 'Are you sure you want to log out?',
    home: 'Home',
    search: 'Search',
    liveTv: 'Live TV',
    watchlist: 'Watchlist',
    movies: 'Movies',
    series: 'Series',
    all: 'All',
    trending: 'Trending',
    popular: 'Top 250',
    topRated: 'Top Rated',
    watchNow: 'Watch Now',
    addToWatchlist: 'Add to Watchlist',
    removeFromWatchlist: 'Remove from Watchlist',
    episodes: 'Episodes',
    season: 'Season',
    category: 'Category',
    viewAll: 'View All',
    seeAll: 'See All',
    searchChannels: 'Search channels...',
    noChannels: 'No channels available',
    searchResults: 'Search Results',
    close: 'Close',
    comments: 'Comments',
    writeComment: 'Write a comment...',
    loginToComment: 'Login to comment...',
    noComments: 'No comments yet. Be the first to share your thoughts!',
    loginRequired: 'Login Required',
    loginToJoin: 'Login to join the conversation and post comments.',
    anonymousUser: 'Anonymous User',
    like: 'Like',
    reply: 'Reply',
    storyLine: 'Story Line',
    seasons: 'Seasons',
    episodesTitle: 'Episodes',
    episode: 'Episode',
    socialMedia: 'Social Media',
    noNotifications: 'No notifications available yet',
    pushNotice: '📣 Push Notice',
    generalNotice: '📥 Notice / News',
    enterCodeToUnlock: 'Enter code to unlock all sections',
    loadingTabanPlay: 'Loading Taban Play...',
    noContentAvailable: 'No content available',
    itemsCount: 'items',
  },
  ku: {
    profile: 'پڕۆفایل',
    becomePro: 'ببە بە پڕۆ',
    activated: 'تەواو چالاک کراوە',
    premiumFeatures: 'هەموو تایبەتمەندییە نایابەکان بکەرەوە',
    lightMode: 'دۆخی ڕووناک',
    darkMode: 'دۆخی تاریک',
    language: 'زمان',
    adminPanel: 'پانێڵی ئەدمین',
    notifications: 'ئاگادارکردنەوەکان',
    downloads: 'داگرتنەکان',
    privacyPolicy: 'سیاسەتی تایبەتمەندی',
    termsConditions: 'مەرج و ڕێساکان',
    rateApp: 'هەڵسەنگاندنی ئەپەکە',
    logout: 'چوونە دەرەوە',
    editName: 'دەستکاری ناو',
    save: 'پاشکەوتکردن',
    cancel: 'پاشگەزبوونەوە',
    logoutConfirm: 'ئایا دڵنیایت لە چوونە دەرەوە؟',
    home: 'سەرەتا',
    search: 'گەڕان',
    liveTv: 'پەخشی ڕاستەوخۆ',
    watchlist: 'سەیڤکراوەکان',
    movies: 'فیلمەکان',
    series: 'زنجیرەکان',
    all: 'هەمووی',
    trending: 'بەربڵاو',
    popular: 'تۆپ 250',
    topRated: 'بەرزترین هەڵسەنگاندن',
    watchNow: 'ئێستا ببینە',
    addToWatchlist: 'زیادکردن بۆ سەیڤکراوەکان',
    removeFromWatchlist: 'سڕینەوە لە سەیڤکراوەکان',
    episodes: 'ئەڵقەکان',
    season: 'وەرز',
    category: 'هاوپۆل',
    viewAll: 'بینینی هەمووی',
    seeAll: 'هەموویان',
    searchChannels: 'گەڕان بۆ کەناڵەکان...',
    noChannels: 'هیچ کەناڵێک بەردەست نییە',
    searchResults: 'ئەنجامی گەڕان',
    close: 'داخستن',
    comments: 'کۆمێنتەکان',
    writeComment: 'کۆمێنتێک بنووسە...',
    loginToComment: 'بۆ نووسینی کۆمێنت بچۆ ژوورەوە...',
    noComments: 'هیچ کۆمێنتێک نییە. یەکەم کەس بە کە ڕای خۆت بڵێیت!',
    loginRequired: 'چوونەژوورەوە پێویستە',
    loginToJoin: 'بۆ بەشداری کردن لە گفتوگۆکە و نووسینی کۆمێنت بچۆ ژوورەوە.',
    anonymousUser: 'بەکارهێنەری نەناسراو',
    like: 'بەدڵبوون',
    reply: 'وەڵامدانەوە',
    storyLine: 'چیرۆکی فیلم',
    seasons: 'وەرزەکان',
    episodesTitle: 'ئەڵقەکان',
    episode: 'ئەڵقەی',
    socialMedia: 'سۆشیاڵ میدیا',
    noNotifications: 'هیچ ئاگادارکردنەوە یان تێبینییەک نییە',
    pushNotice: '📣 ڕاگەیاندن',
    generalNotice: '📥 تێبینی / هەواڵ',
    enterCodeToUnlock: 'داخڵکردنی کۆد بۆ کردنەوەی سەرجەم بەشەکان',
    loadingTabanPlay: 'خەریکی بارکردنی تابان پڵەی...',
    noContentAvailable: 'هیچ ناوەڕۆکێک بەردەست نییە',
    itemsCount: 'بەرهەم',
  },
  badini: {
    profile: 'پرۆفایل',
    becomePro: 'ببە بە پڕۆ',
    activated: 'تەمام چالاککریە',
    premiumFeatures: 'تەڤایا تایبەتمەندیێن بەرز ڤەکەم',
    lightMode: 'دۆخێ ڕووناک',
    darkMode: 'دۆخێ تاریک',
    language: 'زمان',
    adminPanel: 'پانێلا ئەدمینی',
    notifications: 'ئاگاداری',
    downloads: 'داگرتن',
    privacyPolicy: 'سیاسەتا تایبەتیا',
    termsConditions: 'مەرج و یاسا',
    rateApp: 'هەلسەنگاندنا ئاپێ',
    logout: 'دەركەفتن ژ هەژمارێ',
    editName: 'دەستکارییا ناڤی',
    save: 'پاراستن',
    cancel: 'پاشگەزبوون',
    logoutConfirm: 'ئەرێ تۆ یا پشترستی ژ دەركەفتنێ؟',
    home: 'سەرەتایێ',
    search: 'لێگەڕیان',
    liveTv: 'پەخسا ڕاستەوخۆ',
    watchlist: 'سەحبکراو',
    movies: 'فیلم',
    series: 'زنجیرە',
    all: 'هەمی',
    trending: 'بەربەلاڤ',
    popular: 'تۆپ 250',
    topRated: 'بەرزترین هەلسەنگاندن',
    watchNow: 'نوکە سەحبکە',
    addToWatchlist: 'زێدەکرن بۆ سەحبکراوان',
    removeFromWatchlist: 'ژێبرن ژ سەحبکراوان',
    episodes: 'ئەڵقە',
    season: 'وەرز',
    category: 'پۆلین',
    viewAll: 'سەحکرنا هەمیان',
    seeAll: 'هەمیان سەحبکە',
    searchChannels: 'لێگەڕیان بۆ کەناڵان...',
    noChannels: 'هیچ کەناڵەک بەردەست نینە',
    searchResults: 'ئەنجامێن لێگەڕیانێ',
    close: 'گرتن',
    comments: 'کۆمێنت',
    writeComment: 'کۆمێنتەکێ بنڤێسه...',
    loginToComment: 'بۆ نڤێسینا کۆمێنتێ بچە ژۆرڤە...',
    noComments: 'هیچ کۆمێنتەک نینە. یەکەم کەس بە کو دەڕبڕینا خۆ ببیژی!',
    loginRequired: 'چووناژۆرڤە پێدڤیـە',
    loginToJoin: 'بۆ بەشداریکرنێ د ئاخڤتنێ دا و نڤێسینا کۆمێنتێ بچە ژۆرڤە.',
    anonymousUser: 'بەکارهێنەرێ نەنیاس',
    like: 'پلەدان (لایك)',
    reply: 'بەرسڤدان',
    storyLine: 'سەرهاتییا فیلمی',
    seasons: 'وەرز',
    episodesTitle: 'ئەڵقە',
    episode: 'ئەڵقەیا',
    socialMedia: 'سۆشیال میدیا',
    noNotifications: 'هیچ ئاگاداریەک یان تێبینیەک نینە',
    pushNotice: '📣 ڕاگەهاندن',
    generalNotice: '📥 تێبینی / نۆچە',
    enterCodeToUnlock: 'داخڵکرنا کۆدێ بۆ ڤەکرنا تەڤایا بەشان',
    loadingTabanPlay: 'خەریکی بارکرنا تابان پڵەی...',
    noContentAvailable: 'هیچ ناوەڕۆکەک بەردەست نینە',
    itemsCount: 'بەرهەم',
  },
  ar: {
    profile: 'الملف الشخصي',
    becomePro: 'كن برو',
    activated: 'مفعل بالكامل',
    premiumFeatures: 'افتح جميع الميزات المميزة',
    lightMode: 'الوضع الفاتح',
    darkMode: 'الوضع الداكن',
    language: 'اللغة',
    adminPanel: 'لوحة التحكم',
    notifications: 'الإشعارات',
    downloads: 'التنزيلات',
    privacyPolicy: 'سياسة الخصوصية',
    termsConditions: 'الشروط والأحكام',
    rateApp: 'تقييم التطبيق',
    logout: 'تسجيل الخروج',
    editName: 'تعديل الاسم',
    save: 'حفظ',
    cancel: 'إلغاء',
    logoutConfirm: 'هل أنت متأكد أنك تريد تسجيل الخروج؟',
    home: 'الرئيسية',
    search: 'بحث',
    liveTv: 'بث مباشر',
    watchlist: 'المحفوظات',
    movies: 'أفلام',
    series: 'مسلسلات',
    all: 'الكل',
    trending: 'الرائج',
    popular: 'أفضل 250',
    topRated: 'الأعلى تقييماً',
    watchNow: 'شاهد الآن',
    addToWatchlist: 'إضافة إلى المحفوظات',
    removeFromWatchlist: 'إزالة من المحفوظات',
    episodes: 'الحلقات',
    season: 'موسم',
    category: 'الفئة',
    viewAll: 'عرض الكل',
    seeAll: 'عرض الكل',
    searchChannels: 'البحث عن القنوات...',
    noChannels: 'لا توجد قنوات متاحة',
    searchResults: 'نتائج البحث',
    close: 'إغلاق',
    comments: 'التعليقات',
    writeComment: 'اكتب تعليقاً...',
    loginToComment: 'سجل الدخول للتعليق...',
    noComments: 'لا توجد تعليقات بعد. كن أول من يشارك أفكاره!',
    loginRequired: 'تسجيل الدخول مطلوب',
    loginToJoin: 'سجل الدخول للانضمام إلى المحادثة ونشر التعليقات.',
    anonymousUser: 'مستخدم مجهول',
    like: 'إعجاب',
    reply: 'رد',
    storyLine: 'قصة الفيلم',
    seasons: 'مواسم',
    episodesTitle: 'حلقات',
    episode: 'حلقة',
    socialMedia: 'وسائل التواصل الاجتماعي',
    noNotifications: 'لا توجد إشعارات حالياً',
    pushNotice: '📣 إعلان عام',
    generalNotice: '📥 ملاحظة',
    enterCodeToUnlock: 'إدخال الكود لفتح جميع الأقسام',
    loadingTabanPlay: 'جاري تحميل تابان بلاي...',
    noContentAvailable: 'لا يوجد محتوى متاح',
    itemsCount: 'عنصر',
  }
};
