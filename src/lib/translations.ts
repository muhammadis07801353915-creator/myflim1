export type Language = 'en' | 'ku' | 'ar';

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
}

export const getLocalized = (item: any, field: 'title' | 'description' | 'name', language: string) => {
  if (!item) return '';
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
    popular: 'Popular',
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
    popular: 'ناودار',
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
    popular: 'الأكثر شعبية',
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
  }
};
