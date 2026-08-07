'use client';

import { 
  Bell, 
  Download, 
  Shield, 
  FileText, 
  Star, 
  LogOut, 
  ChevronRight, 
  Crown, 
  Moon, 
  Sun, 
  Languages, 
  Camera, 
  Edit2,
  Bookmark,
  Clock,
  Settings,
  HelpCircle,
  Info,
  User,
  Key,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import ProSubscriptionModal from './ProSubscriptionModal';
import { getProStatusLocal } from '../lib/pro';
import { useLanguage } from '../lib/LanguageContext';
import { getLocalized } from '../lib/translations';

export default function Profile() {
  const navigate = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [showProModal, setShowProModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockCode, setUnlockCode] = useState('');
  const [showDownloads, setShowDownloads] = useState(false);
  const [downloadedMovies, setDownloadedMovies] = useState<any[]>([]);
  const isRTL = language === 'ku' || language === 'ar';

  const [userName, setUserName] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('user_name') || 'Dilovan';
    return 'Dilovan';
  });
  const [profileImage, setProfileImage] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('user_image') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
  });
  const [tempName, setTempName] = useState(userName);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document.documentElement.classList.contains('light-mode')) {
      setIsDarkMode(false);
    }
    setIsPro(getProStatusLocal());
    const saved = JSON.parse(localStorage.getItem('myfilm_downloads') || '[]');
    setDownloadedMovies(saved);
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.add('light-mode');
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.remove('light-mode');
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  const handleLogout = () => {
    if (window.confirm(t.logoutConfirm)) {
      localStorage.removeItem('pro_data');
      window.location.reload();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
        localStorage.setItem('user_image', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveName = () => {
    setUserName(tempName);
    localStorage.setItem('user_name', tempName);
    setShowNameModal(false);
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = unlockCode.trim().toLowerCase();
    if (code === 'taban play1' || code === 'tabanplay1') {
      localStorage.setItem('pro_data', JSON.stringify({ isPro: true, expiry: Date.now() + 365*24*60*60*1000 }));
      setIsPro(true);
      setShowUnlockModal(false);
      alert(language === 'ku' ? 'کۆدەکە بە سەرکەوتوویی چالاککرا!' : 'Code activated successfully!');
    } else {
      alert(language === 'ku' ? 'کۆدەکە هەڵەیە' : 'Invalid code');
    }
  };

  const removeDownload = (id: number) => {
    const updated = downloadedMovies.filter(m => m.id !== id);
    setDownloadedMovies(updated);
    localStorage.setItem('myfilm_downloads', JSON.stringify(updated));
  };

  if (showDownloads) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto pt-8 pb-32 text-white light-mode:text-black min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex items-center space-x-4 rtl:space-x-reverse mb-8">
          <button 
            onClick={() => setShowDownloads(false)}
            className="w-10 h-10 bg-neutral-900 light-mode:bg-neutral-100 rounded-full flex items-center justify-center hover:bg-neutral-800 transition"
          >
            <ChevronRight size={24} className="rotate-180 rtl:rotate-0" />
          </button>
          <h2 className="text-2xl font-bold">{t.downloads || 'Downloads'}</h2>
        </div>

        {downloadedMovies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
            <div className="w-20 h-20 bg-neutral-900 light-mode:bg-neutral-100 rounded-full flex items-center justify-center mb-4">
              <Download size={32} />
            </div>
            <p>{language === 'ku' ? 'هیچ فیلمێک دانەبەزیوە' : 'No movies downloaded yet'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {downloadedMovies.map((movie) => (
              <div key={movie.id} className="bg-[#14151c] light-mode:bg-neutral-100 border border-white/10 light-mode:border-neutral-200 rounded-2xl overflow-hidden flex h-32 group">
                <div className="w-24 relative flex-none">
                  <Image src={movie.image} alt={movie.title} fill className="object-cover" unoptimized />
                </div>
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-white light-mode:text-black line-clamp-1">
                      {getLocalized(movie, 'title', language)}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-neutral-500 mt-1">
                      <span className="flex items-center text-yellow-500"><Star size={12} className="mr-1 fill-current" /> {movie.rating}</span>
                      <span>•</span>
                      <span>{movie.year}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <button 
                      onClick={() => alert(language === 'ku' ? 'بۆ سەیرکردن، بڕۆوە سەر لاپەڕەی سەرەکی' : 'Go to main page to watch')}
                      className="px-4 py-1.5 bg-[#CC222F] text-white rounded-lg text-xs font-bold hover:bg-red-700 transition"
                    >
                      Watch Now
                    </button>
                    <button 
                      onClick={() => removeDownload(movie.id)}
                      className="px-4 py-1.5 bg-neutral-800 light-mode:bg-neutral-200 text-white light-mode:text-black rounded-lg text-xs font-bold hover:bg-neutral-700 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto pt-6 pb-32 text-white font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* ── 1. HEADER ROW (User Avatar, Greeting & Settings Icon) ──── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 relative rounded-full border-2 border-[#CC222F] overflow-hidden p-0.5 shadow-lg shadow-red-900/20">
              <Image 
                src={profileImage} 
                alt="Profile" 
                fill
                className="object-cover rounded-full" 
                sizes="64px"
              />
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 bg-[#CC222F] w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#0a0a0f] hover:bg-red-700 transition"
            >
              <Camera size={12} className="text-white" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              className="hidden" 
              accept="image/*" 
            />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              {language === 'ku' ? `سڵاو، ${userName}` : language === 'ar' ? `مرحباً، ${userName}` : `Hi, ${userName}`}
            </h2>
            <button 
              onClick={() => {
                setTempName(userName);
                setShowNameModal(true);
              }}
              className="text-xs text-white/50 hover:text-white font-medium mt-0.5 transition flex items-center gap-1"
            >
              <span>{language === 'ku' ? 'دەستکاری پرۆفایل >' : language === 'ar' ? 'تعديل الملف الشخصي >' : 'Edit Profile >'}</span>
            </button>
          </div>
        </div>

        <button 
          onClick={() => { setTempName(userName); setShowNameModal(true); }}
          className="w-10 h-10 rounded-full bg-white/7 border border-white/10 flex items-center justify-center hover:bg-white/12 transition text-white/80 hover:text-white"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* ── 2. STATS CARDS GRID (Watchlist / History / Downloads) ───── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {/* Watchlist */}
        <div 
          onClick={() => navigate.push('/#watchlist')}
          className="bg-[#14151c] border border-white/10 hover:border-[#CC222F]/50 rounded-2xl p-3.5 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <Bookmark size={18} className="text-[#CC222F]" />
            <span className="w-4 h-4 rounded-full bg-[#CC222F]/20 text-[#CC222F] text-[10px] font-black flex items-center justify-center">+</span>
          </div>
          <p className="text-[11px] font-semibold text-white/50">{language === 'ku' ? 'لیستی بینین' : language === 'ar' ? 'قائمتي' : 'Watchlist'}</p>
          <p className="text-2xl font-black text-white mt-0.5">24</p>
        </div>

        {/* History */}
        <div 
          onClick={() => navigate.push('/#history')}
          className="bg-[#14151c] border border-white/10 hover:border-[#CC222F]/50 rounded-2xl p-3.5 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <Clock size={18} className="text-[#CC222F]" />
          </div>
          <p className="text-[11px] font-semibold text-white/50">{language === 'ku' ? 'مێژوو' : language === 'ar' ? 'السجل' : 'History'}</p>
          <p className="text-2xl font-black text-white mt-0.5">56</p>
        </div>

        {/* Downloads */}
        <div 
          onClick={() => setShowDownloads(true)}
          className="bg-[#14151c] border border-white/10 hover:border-[#CC222F]/50 rounded-2xl p-3.5 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <Download size={18} className="text-[#CC222F]" />
            <span className="w-4 h-4 rounded-full bg-[#CC222F]/20 text-[#CC222F] text-[10px] font-black flex items-center justify-center">+</span>
          </div>
          <p className="text-[11px] font-semibold text-white/50">{language === 'ku' ? 'داگرتنەکان' : language === 'ar' ? 'التنزيلات' : 'Downloads'}</p>
          <p className="text-2xl font-black text-white mt-0.5">12</p>
        </div>
      </div>

      {/* ── 3. ENTER CODE BANNER ───────────────────────────────────── */}
      <div 
        onClick={() => setShowUnlockModal(true)}
        className="bg-[#CC222F]/12 border border-[#CC222F]/30 hover:border-[#CC222F]/60 rounded-2xl p-4 mb-6 cursor-pointer transition flex items-center justify-between"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-[#CC222F]/20 flex items-center justify-center shrink-0">
            <Key size={22} className="text-[#CC222F]" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[#CC222F]">
              {isPro 
                ? (language === 'ku' ? 'کۆد چالاککراوە' : 'Code Activated') 
                : (language === 'ku' ? 'داخڵکردنی کۆد' : 'Enter Code')
              }
            </h3>
            <p className="text-xs text-white/60 mt-0.5">
              {isPro 
                ? (language === 'ku' ? 'سەرجەم بەشەکان بە سەرکەوتوویی کراونەتەوە' : 'All app sections unlocked') 
                : (language === 'ku' ? 'کۆدەکە بنووسە بۆ چالاککردنی سەرجەم بەشەکان' : 'Enter code to unlock all app sections')
              }
            </p>
          </div>
        </div>
        <ChevronRight size={20} className="text-[#CC222F] rtl:rotate-180 shrink-0" />
      </div>

      {/* ── 4. MENU ITEMS LIST ─────────────────────────────────────── */}
      <div className="space-y-2.5">
        <ProfileMenuItem icon={Bookmark} label={language === 'ku' ? 'لیستی من' : language === 'ar' ? 'قائمتي' : 'My List'} />
        <ProfileMenuItem icon={Clock} label={language === 'ku' ? 'بەردەوامبوون لە بینین' : language === 'ar' ? 'متابعة المشاهدة' : 'Continue Watching'} />
        <ProfileMenuItem icon={Download} label={language === 'ku' ? 'داگرتنەکان' : language === 'ar' ? 'التنزيلات' : 'Downloads'} onClick={() => setShowDownloads(true)} />
        <ProfileMenuItem icon={User} label={language === 'ku' ? 'ڕێکخستنەکانی هەژمار' : language === 'ar' ? 'إعدادات الحساب' : 'Account Settings'} onClick={() => { setTempName(userName); setShowNameModal(true); }} />
        <ProfileMenuItem icon={Crown} label={language === 'ku' ? 'ئابوونەبوون' : language === 'ar' ? 'الاشتراك' : 'Subscription'} textClass="text-amber-400" onClick={() => setShowProModal(true)} />
        
        {/* Language Menu Item */}
        <div className="relative">
          <button 
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="w-full flex items-center justify-between p-4 bg-[#14151c] hover:bg-[#1c1e28] rounded-2xl transition border border-white/6"
          >
            <div className="flex items-center space-x-3.5 rtl:space-x-reverse">
              <Languages size={20} className="text-white/80" />
              <span className="font-bold text-sm text-white">{language === 'ku' ? 'زمانی وێب‌سایت' : language === 'ar' ? 'لغة الموقع' : 'Language'}</span>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="text-xs text-white/50 uppercase font-bold">{language}</span>
              <ChevronRight size={18} className={`text-white/40 transition-transform ${showLangMenu ? 'rotate-90' : 'rtl:rotate-180'}`} />
            </div>
          </button>
          
          {showLangMenu && (
            <div className="mt-2 bg-[#1c1e28] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl">
              <LangOption label="English" flag="🇬🇧" active={language === 'en'} onClick={() => { setLanguage('en'); setShowLangMenu(false); }} />
              <LangOption label="کوردی" flag="☀️" active={language === 'ku'} onClick={() => { setLanguage('ku'); setShowLangMenu(false); }} />
              <LangOption label="العربية" flag="🇮🇶" active={language === 'ar'} onClick={() => { setLanguage('ar'); setShowLangMenu(false); }} />
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="w-full flex items-center justify-between p-4 bg-[#14151c] hover:bg-[#1c1e28] rounded-2xl transition border border-white/6"
        >
          <div className="flex items-center space-x-3.5 rtl:space-x-reverse">
            {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-400" />}
            <span className="font-bold text-sm text-white">
              {isDarkMode ? t.lightMode : t.darkMode}
            </span>
          </div>
        </button>

        <ProfileMenuItem icon={HelpCircle} label={language === 'ku' ? 'یارمەتی و پشتیوانی' : language === 'ar' ? 'المساعدة والدعم' : 'Help & Support'} />
        <ProfileMenuItem icon={Info} label={language === 'ku' ? 'دەربارەی Taban Play' : language === 'ar' ? 'حول Taban Play' : 'About Taban Play'} />
        <ProfileMenuItem icon={LogOut} label={t.logout} textClass="text-red-500" onClick={handleLogout} />
      </div>

      {/* Name Edit Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#181924] w-full max-w-xs rounded-2xl p-6 border border-white/10 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">{t.editName}</h3>
            <input 
              type="text" 
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="w-full bg-white/7 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#CC222F] mb-6 text-sm"
              autoFocus
            />
            <div className="flex space-x-3 rtl:space-x-reverse">
              <button 
                onClick={() => setShowNameModal(false)}
                className="flex-1 py-2 bg-white/8 text-white/70 rounded-xl font-bold text-sm hover:bg-white/15 transition"
              >
                {t.cancel}
              </button>
              <button 
                onClick={handleSaveName}
                className="flex-1 py-2 bg-[#CC222F] text-white rounded-xl font-bold text-sm hover:bg-red-700 transition"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Code Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form onSubmit={handleUnlockSubmit} className="bg-[#181924] w-full max-w-xs rounded-2xl p-6 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{language === 'ku' ? 'داخڵکردنی کۆد' : 'Enter Code'}</h3>
              <button type="button" onClick={() => setShowUnlockModal(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>
            <p className="text-xs text-white/60 mb-4">{language === 'ku' ? 'کۆدی چالاککردنەکە بنووسە:' : 'Please enter code:'}</p>
            <input 
              type="text" 
              value={unlockCode}
              onChange={(e) => setUnlockCode(e.target.value)}
              placeholder="Code..."
              className="w-full bg-white/7 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 outline-none focus:border-[#CC222F] mb-6 text-sm"
              autoFocus
            />
            <div className="flex space-x-3 rtl:space-x-reverse">
              <button 
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="flex-1 py-2.5 bg-white/8 text-white/70 rounded-xl font-bold text-sm hover:bg-white/15 transition"
              >
                {t.cancel}
              </button>
              <button 
                type="submit"
                className="flex-1 py-2.5 bg-[#CC222F] text-white rounded-xl font-bold text-sm hover:bg-red-700 transition"
              >
                {language === 'ku' ? 'چالاککردن' : 'Activate'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ProSubscriptionModal isOpen={showProModal} onClose={() => setShowProModal(false)} />
    </div>
  );
}

function LangOption({ label, flag, active, onClick }: { label: string, flag: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full text-left rtl:text-right p-3.5 hover:bg-white/5 transition flex items-center justify-between ${active ? 'text-[#CC222F] bg-[#CC222F]/5' : 'text-white/80'}`}
    >
      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        <span className="text-lg">{flag}</span>
        <span className="font-bold text-sm">{label}</span>
      </div>
      {active && <div className="w-2 h-2 rounded-full bg-[#CC222F]" />}
    </button>
  );
}

function ProfileMenuItem({ icon: Icon, label, textClass = "text-white", onClick }: { icon: any, label: string, textClass?: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-[#14151c] hover:bg-[#1c1e28] rounded-2xl transition border border-white/6 group"
    >
      <div className="flex items-center space-x-3.5 rtl:space-x-reverse">
        <Icon size={20} className={textClass === 'text-red-500' ? 'text-red-500' : textClass === 'text-amber-400' ? 'text-amber-400' : 'text-white/80'} />
        <span className={`font-bold text-sm ${textClass}`}>{label}</span>
      </div>
      <ChevronRight size={18} className="text-white/40 group-hover:text-white transition-colors rtl:rotate-180" />
    </button>
  );
}
