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
  trendingNow: string;
  noResults: string;
  filterByType: string;
  results: string;
  overview: string;
  availableServers: string;
  chooseServer: string;
  noDescription: string;
  available: string;
  noNotifications: string;
  pushNotice: string;
  generalNotice: string;
  enterCodeToUnlock: string;
  loadingTabanPlay: string;
  noContentAvailable: string;
  itemsCount: string;
}

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
    trendingNow: 'Trending Now',
    noResults: 'No results found.',
    filterByType: 'Filter by Type',
    results: 'Results',
    overview: 'Overview',
    availableServers: 'Available Servers',
    chooseServer: 'Choose Server',
    noDescription: 'No description available.',
    available: 'available',
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
    trendingNow: 'تۆپ 250',
    noResults: 'هیچ ئەنجامێک نەدۆزرایەوە.',
    filterByType: 'پاڵاوتن بەپێی جۆر',
    results: 'ئەنجامەکان',
    overview: 'پوختە',
    availableServers: 'سێرڤەرە بەردەستەکان',
    chooseServer: 'سێرڤەر هەڵبژێرە',
    noDescription: 'زانیاری بەردەست نییە.',
    available: 'بەردەستە',
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
    trendingNow: 'تۆپ 250',
    noResults: 'هیچ ئەنجامەک نەهاتە دیتن.',
    filterByType: 'پاڵاوتن ل دویڤ جۆری',
    results: 'ئەنجام',
    overview: 'پوختە',
    availableServers: 'سێرڤەرێن بەردەست',
    chooseServer: 'سێرڤەرەکێ هەڵبژێره',
    noDescription: 'زانیاری بەردەست نینە.',
    available: 'بەردەستە',
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
    trendingNow: 'أفضل 250',
    noResults: 'لم يتم العثور على نتائج.',
    filterByType: 'تصفية حسب النوع',
    results: 'النتائج',
    overview: 'القصة',
    availableServers: 'السيرفرات المتاحة',
    chooseServer: 'اختر السيرفر',
    noDescription: 'لا يوجد وصف متاح.',
    available: 'متاح',
    noNotifications: 'لا توجد إشعارات حالياً',
    pushNotice: '📣 إعلان عام',
    generalNotice: '📥 ملاحظة',
    enterCodeToUnlock: 'إدخال الكود لفتح جميع الأقسام',
    loadingTabanPlay: 'جاري تحميل تابان بلاي...',
    noContentAvailable: 'لا يوجد محتوى متاح',
    itemsCount: 'عنصر',
  }
};
