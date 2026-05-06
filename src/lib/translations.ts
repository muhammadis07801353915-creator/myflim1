export type Language = 'en' | 'ku' | 'ar' | 'hi';

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
}

const commonNameTranslations: Record<string, Record<Language, string>> = {
  'All': { en: 'All', ku: 'هەمووی', ar: 'الكل', hi: 'सभी' },
  'News': { en: 'News', ku: 'هەواڵ', ar: 'الأخبار', hi: 'समाचार' },
  'Entertainment': { en: 'Entertainment', ku: 'بەکات بەسەربردن', ar: 'ترفيه', hi: 'मनोरंजन' },
  'Kids': { en: 'Kids', ku: 'مناڵان', ar: 'أطفال', hi: 'बच्चे' },
  'Sports': { en: 'Sports', ku: 'وەرزش', ar: 'رياضة', hi: 'खेल' },
  'Movies': { en: 'Movies', ku: 'فیلمەکان', ar: 'أفلام', hi: 'फिल्में' },
  'Series': { en: 'Series', ku: 'زنجیرەکان', ar: 'مسلسلات', hi: 'सीरीज़' },
  'Newest Added': { en: 'Newest Added', ku: 'نوێترین زیادکراو', ar: 'أحدث الإضافات', hi: 'नया जोड़ा गया' },
  'نوێترین زیادکراو': { en: 'Newest Added', ku: 'نوێترین زیادکراو', ar: 'أحدث الإضافات', hi: 'नया जोड़ा गया' },
  'فلیمی کوردی دۆبلاژ': { en: 'Kurdish Dubbed', ku: 'فلیمی کوردی دۆبلاژ', ar: 'مدبلج كردي', hi: 'कुर्दिश डब' },
  'Popular': { en: 'TOP 250', ku: 'تۆپ ٢٥٠', ar: 'توب ٢٥٠', hi: 'टॉप 250' },
  'Top Contents': { en: 'TOP 250', ku: 'تۆپ ٢٥٠', ar: 'توب ٢٥٠', hi: 'टॉप 250' },
};

export const getLocalized = (item: any, field: 'title' | 'description' | 'name', language: string) => {
  if (!item) return '';
  
  // If item is a string, treat it as the value to be translated
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
    adminPanel: 'Admin Panel (Test)',
    notifications: 'Notifications',
    downloads: 'Downloads',
    privacyPolicy: 'Privacy Policy',
    termsConditions: 'Terms & Conditions',
    rateApp: 'Rate this app',
    logout: 'Log out',
    editName: 'Edit Name',
    save: 'Save',
    cancel: 'Cancel',
    logoutConfirm: 'Are you sure you want to log out? This will also deactivate PRO on this device.',
    home: 'Home',
    search: 'Search',
    liveTv: 'Live TV',
    watchlist: 'Watchlist',
    movies: 'Movies',
    series: 'Series',
    all: 'All',
    trending: 'Trending',
    popular: 'TOP 250',
    topRated: 'Top Rated',
    watchNow: 'Watch Now',
    addToWatchlist: 'Add to Watchlist',
    removeFromWatchlist: 'Remove from Watchlist',
    episodes: 'Episodes',
    season: 'Season',
    category: 'Category',
    viewAll: 'View all',
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
  },
  ku: {
    profile: 'پڕۆفایل',
    becomePro: 'ببە بە پڕۆ',
    activated: 'تەواو چالاک کراوە',
    premiumFeatures: 'هەموو تایبەتمەندییە نایابەکان بکەرەوە',
    lightMode: 'دۆخی ڕووناک',
    darkMode: 'دۆخی تاریک',
    language: 'زمان',
    adminPanel: 'پانێڵی ئەدمین (تاقیکردنەوە)',
    notifications: 'ئاگادارکردنەوەکان',
    downloads: 'داگرتنەکان',
    privacyPolicy: 'سیاسەتی تایبەتمەندی',
    termsConditions: 'مەرج و ڕێساکان',
    rateApp: 'هەڵسەنگاندنی ئەپەکە',
    logout: 'چوونە دەرەوە',
    editName: 'دەستکاری ناو',
    save: 'پاشکەوتکردن',
    cancel: 'پاشگەزبوونەوە',
    logoutConfirm: 'ئایا دڵنیایت لە چوونە دەرەوە؟ ئەمە دەبێتە هۆی ناچالاککردنی PRO لەسەر ئەم ئامێرە.',
    home: 'سەرەتا',
    search: 'گەڕان',
    liveTv: 'پەخشی ڕاستەوخۆ',
    watchlist: 'لیستی بینین',
    movies: 'فیلمەکان',
    series: 'زنجیرەکان',
    all: 'هەمووی',
    trending: 'بەربڵاو',
    popular: 'تۆپ ٢٥٠',
    topRated: 'بەرزترین هەڵسەنگاندن',
    watchNow: 'ئێستا ببینە',
    addToWatchlist: 'زیادکردن بۆ لیستی بینین',
    removeFromWatchlist: 'سڕینەوە لە لیستی بینین',
    episodes: 'ئەڵقەکان',
    season: 'وەرز',
    category: 'هاوپۆل',
    viewAll: 'بینینی هەمووی',
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
  },
  ar: {
    profile: 'الملف الشخصي',
    becomePro: 'كن برو',
    activated: 'مفعل بالكامل',
    premiumFeatures: 'افتح جميع الميزات المميزة',
    lightMode: 'الوضع الفاتح',
    darkMode: 'الوضع الداكن',
    language: 'اللغة',
    adminPanel: 'لوحة التحكم (تجريبي)',
    notifications: 'الإشعارات',
    downloads: 'التنزيلات',
    privacyPolicy: 'سياسة الخصوصية',
    termsConditions: 'الشروط والأحكام',
    rateApp: 'تقييم التطبيق',
    logout: 'تسجيل الخروج',
    editName: 'تعديل الاسم',
    save: 'حفظ',
    cancel: 'إلغاء',
    logoutConfirm: 'هل أنت متأكد أنك تريد تسجيل الخروج؟ سيؤدي هذا أيضًا إلى إلغاء تنشيط PRO على هذا الجهاز.',
    home: 'الرئيسية',
    search: 'بحث',
    liveTv: 'بث مباشر',
    watchlist: 'قائمة المشاهدة',
    movies: 'أفلام',
    series: 'مسلسلات',
    all: 'الكل',
    trending: 'الرائج',
    popular: 'توب ٢٥٠',
    topRated: 'الأعلى تقييماً',
    watchNow: 'شاهد الآن',
    addToWatchlist: 'إضافة إلى قائمة المشاهدة',
    removeFromWatchlist: 'إزالة من قائمة المشاهدة',
    episodes: 'الحلقات',
    season: 'موسم',
    category: 'الفئة',
    viewAll: 'عرض الكل',
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
    socialMedia: 'سۆشیاڵ میدیا',
  },
  hi: {
    profile: 'प्रोफ़ाइल',
    becomePro: 'प्रो बनें',
    activated: 'पूरी तरह से सक्रिय',
    premiumFeatures: 'सभी प्रीमियम सुविधाएँ अनलॉक करें',
    lightMode: 'लाइट मोड',
    darkMode: 'डार्क मोड',
    language: 'भाषा',
    adminPanel: 'व्यवस्थापक पैनल (टेस्ट)',
    notifications: 'सूचनाएं',
    downloads: 'डाउनलोड',
    privacyPolicy: 'गोपनीयता नीति',
    termsConditions: 'नियम और शर्तें',
    rateApp: 'ऐप को रेट करें',
    logout: 'लॉग आउट',
    editName: 'नाम संपादित करें',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    logoutConfirm: 'क्या आप वाकई लॉग आउट करना चाहते हैं? इससे इस डिवाइस पर PRO भी निष्क्रिय हो जाएगा।',
    home: 'होम',
    search: 'खोजें',
    liveTv: 'लाइव टीवी',
    watchlist: 'वॉचलिस्ट',
    movies: 'फिल्में',
    series: 'सीरीज़',
    all: 'सभी',
    trending: 'ट्रेंडिंग',
    popular: 'टॉप 250',
    topRated: 'शीर्ष रेटेड',
    watchNow: 'अभी देखें',
    addToWatchlist: 'वॉचलिस्ट में जोड़ें',
    removeFromWatchlist: 'वॉचलिस्ट से हटाएं',
    episodes: 'एपिसोड',
    season: 'सीज़न',
    category: 'श्रेणी',
    viewAll: 'सभी देखें',
    searchChannels: 'चैनल खोजें...',
    noChannels: 'कोई चैनल उपलब्ध नहीं है',
    searchResults: 'खोज परिणाम',
    close: 'बंद करें',
    comments: 'टिप्पणियाँ',
    writeComment: 'एक टिप्पणी लिखें...',
    loginToComment: 'टिप्पणी करने के लिए लॉग इन करें...',
    noComments: 'अभी तक कोई टिप्पणी नहीं। अपने विचार साझा करने वाले पहले व्यक्ति बनें!',
    loginRequired: 'लॉगिन आवश्यक है',
    loginToJoin: 'बातचीत में शामिल होने और टिप्पणी करने के लिए लॉग इन करें।',
    anonymousUser: 'अज्ञात उपयोगकर्ता',
    like: 'पसंद करें',
    reply: 'जवाब दें',
    storyLine: 'कहानी',
    seasons: 'सीज़न',
    episodesTitle: 'एपिसोड',
    episode: 'एपिसोड',
    socialMedia: 'सोशल मीडिया',
  },
};
