'use client';

import { 
  User, 
  Crown, 
  ChevronRight, 
  Languages, 
  Sun, 
  Moon, 
  HelpCircle, 
  Info, 
  LogOut, 
  Camera,
  X,
  Bookmark,
  Clock,
  Download,
  Key,
  Play,
  CheckCircle2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLanguage } from '../lib/LanguageContext';
import { getLocalized } from '../lib/translations';
import { useRouter } from 'next/navigation';
import { getProStatusLocal, setProStatus } from '../lib/pro';
import { supabase } from '../lib/supabase';

export default function Profile() {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useRouter();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [aboutText, setAboutText] = useState('');

  const [userName, setUserName] = useState('User');
  const [tempName, setTempName] = useState('User');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [unlockCode, setUnlockCode] = useState('');

  const [watchlistItems, setWatchlistItems] = useState<any[]>([]);
  const [historyItems, setHistoryItems] = useState<any[]>([]);

  useEffect(() => {
    const savedName = localStorage.getItem('myfilm_user_name');
    if (savedName) {
      setUserName(savedName);
      setTempName(savedName);
    }
    
    // Theme persistence check
    const savedTheme = localStorage.getItem('myfilm_theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light-mode');
      document.body.classList.add('light-mode');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.remove('light-mode');
      document.body.classList.remove('light-mode');
      setIsDarkMode(true);
    }

    setIsPro(getProStatusLocal());

    // Watchlist & history sync
    const loadState = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('myfilm_watchlist') || '[]');
        setWatchlistItems(saved);

        const hist = JSON.parse(localStorage.getItem('myfilm_history') || '{}');
        setHistoryItems(Object.values(hist).sort((a: any, b: any) => b.updatedAt - a.updatedAt));
      } catch (e) {
        console.warn(e);
      }
    };
    loadState();

    window.addEventListener('storage', loadState);
    window.addEventListener('watchlistUpdated', loadState);
    window.addEventListener('historyUpdated', loadState);

    // Fetch About text from Supabase
    const fetchAbout = async () => {
      try {
        const { data } = await supabase.from('settings').select('value').eq('key', 'about_taban_play').single();
        if (data?.value) setAboutText(data.value);
      } catch (e) {
        console.warn(e);
      }
    };
    fetchAbout();

    return () => {
      window.removeEventListener('storage', loadState);
      window.removeEventListener('watchlistUpdated', loadState);
      window.removeEventListener('historyUpdated', loadState);
    };
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.add('light-mode');
      document.body.classList.add('light-mode');
      localStorage.setItem('myfilm_theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.remove('light-mode');
      document.body.classList.remove('light-mode');
      localStorage.setItem('myfilm_theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      localStorage.setItem('myfilm_user_name', tempName.trim());
      setShowNameModal(false);
    }
  };

  const handleLogout = () => {
    if (confirm(language === 'ku' ? 'دڵنیایت لە چوونه‌ده‌ره‌وه‌؟' : 'Are you sure you want to log out?')) {
      localStorage.removeItem('myfilm_user_name');
      setUserName('User');
      setTempName('User');
    }
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = unlockCode.trim().toLowerCase();
    if (normalized === 'taban play1' || normalized === 'tabanplay1') {
      setProStatus('UNLOCKED', new Date(Date.now() + 365*24*60*60*1000).toISOString());
      setIsPro(true);
      setShowUnlockModal(false);
      setUnlockCode('');
      alert(language === 'ku' ? 'سەرکەوتوو بوو! ئەپەکە بە سەرکەوتوویی بەتەواوی کرایەوە.' : 'Success! App fully unlocked.');
    } else {
      alert(language === 'ku' ? 'کۆدەکە هەڵەیە، تکایە دووبارە هەوڵبدەرەوە.' : 'Invalid code. Please try again.');
    }
  };

  const formatTime = (secs: number) => {
    if (!secs) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="p-4 md:p-8 pt-8 max-w-xl mx-auto pb-32 text-white light-mode:text-black">
      
      {/* ── TOP PROFILE HEADER (Avatar & Name & Edit Button) ────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className="relative p-0.5 rounded-full border-2 border-[#CC222F]">
            <div className="w-16 h-16 rounded-full overflow-hidden relative bg-[#181924] light-mode:bg-neutral-200">
              <Image 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" 
                alt={userName} 
                fill 
                className="object-cover"
                unoptimized
              />
            </div>
            <button 
              onClick={() => setShowNameModal(true)}
              className="absolute -bottom-1 -right-1 rtl:-right-auto rtl:-left-1 w-6 h-6 rounded-full bg-[#CC222F] text-white flex items-center justify-center border-2 border-[#0F0F13] light-mode:border-white hover:scale-110 transition shadow-md"
            >
              <Camera size={11} />
            </button>
          </div>
          <div>
            <h1 className="text-xl font-black text-white light-mode:text-black tracking-tight">
              {language === 'ku' ? `سڵاو، ${userName}` : language === 'ar' ? `مرحباً، ${userName}` : `Hi, ${userName}`}
            </h1>
            <button 
              onClick={() => setShowNameModal(true)} 
              className="text-xs font-semibold text-white/50 light-mode:text-neutral-500 hover:text-white light-mode:hover:text-black transition flex items-center gap-1 mt-0.5"
            >
              <span>{language === 'ku' ? 'دەستکاری پرۆفایل >' : language === 'ar' ? 'تعديل الملف الشخصي >' : 'Edit Profile >'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 3 STATS CARDS ROW ────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {/* Card 1: Saved Items */}
        <div 
          onClick={() => setShowSavedModal(true)} 
          className="bg-[#14151c] light-mode:bg-white hover:bg-[#1a1b24] light-mode:hover:bg-neutral-50 border border-white/6 light-mode:border-neutral-200 rounded-2xl p-4 cursor-pointer transition shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <Bookmark size={18} className="text-[#CC222F]" />
            <div className="w-[18px] h-[18px] rounded-full bg-[#CC222F]/15 flex items-center justify-center text-[#CC222F] font-black text-[10px]">
              +
            </div>
          </div>
          <p className="text-[11px] font-semibold text-white/60 light-mode:text-neutral-500 mb-1 truncate">{language === 'ku' ? 'سەیڤکراوەکان' : language === 'ar' ? 'المحفوظات' : 'Saved'}</p>
          <p className="text-2xl font-black text-white light-mode:text-black tracking-tight">{watchlistItems.length}</p>
        </div>

        {/* Card 2: History / Resume Playback */}
        <div 
          onClick={() => setShowHistoryModal(true)} 
          className="bg-[#14151c] light-mode:bg-white hover:bg-[#1a1b24] light-mode:hover:bg-neutral-50 border border-white/6 light-mode:border-neutral-200 rounded-2xl p-4 cursor-pointer transition shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <Clock size={18} className="text-[#CC222F]" />
          </div>
          <p className="text-[11px] font-semibold text-white/60 light-mode:text-neutral-500 mb-1 truncate">{language === 'ku' ? 'لە هەمان شوێن' : language === 'ar' ? 'متابعة المشاهدة' : 'Continue Watching'}</p>
          <p className="text-2xl font-black text-white light-mode:text-black tracking-tight">{historyItems.length}</p>
        </div>

        {/* Card 3: Downloads */}
        <div 
          onClick={() => alert(language === 'ku' ? 'بەشی دابەزاندن بەمزوانە بەردەست دەبێت!' : 'Downloads feature coming soon!')}
          className="bg-[#14151c] light-mode:bg-white hover:bg-[#1a1b24] light-mode:hover:bg-neutral-50 border border-white/6 light-mode:border-neutral-200 rounded-2xl p-4 cursor-pointer transition shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <Download size={18} className="text-[#CC222F]" />
            <div className="w-[18px] h-[18px] rounded-full bg-[#CC222F]/15 flex items-center justify-center text-[#CC222F] font-black text-[10px]">
              +
            </div>
          </div>
          <p className="text-[11px] font-semibold text-white/60 light-mode:text-neutral-500 mb-1 truncate">{language === 'ku' ? 'دابەزاندن' : language === 'ar' ? 'التنزيلات' : 'Downloads'}</p>
          <p className="text-xs font-extrabold text-[#CC222F] mt-2">{language === 'ku' ? 'بەمزوانە' : language === 'ar' ? 'قريباً' : 'Coming Soon'}</p>
        </div>
      </div>

      {/* ── ENTER CODE / PRO BANNER ─────────────────────────────────── */}
      <div 
        onClick={() => setShowUnlockModal(true)}
        className="mb-6 p-4 rounded-2xl bg-[#CC222F]/10 light-mode:bg-red-50 border border-[#CC222F]/30 light-mode:border-red-200 flex items-center justify-between cursor-pointer hover:bg-[#CC222F]/15 transition group"
      >
        <div className="flex items-center space-x-3.5 rtl:space-x-reverse">
          <div className="w-11 h-11 rounded-full bg-[#CC222F]/20 flex items-center justify-center text-[#CC222F]">
            <Key size={22} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[#CC222F]">
              {isPro 
                ? (language === 'ku' ? 'کۆد چالاککراوە' : 'Code Activated') 
                : (language === 'ku' ? 'داخڵکردنی کۆد' : 'Enter Code')
              }
            </h3>
            <p className="text-xs text-white/50 light-mode:text-neutral-600 mt-0.5">
              {isPro 
                ? (language === 'ku' ? 'سەرجەم بەشەکان بە سەرکەوتوویی کراونەتەوە' : 'All app sections successfully unlocked') 
                : (language === 'ku' ? 'کۆدەکە بنووسە بۆ چالاککردنی سەرجەم بەشەکان' : 'Enter code to unlock all sections of the app')
              }
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-[#CC222F] rtl:rotate-180 group-hover:translate-x-1 transition-transform" />
      </div>

      {/* ── MENU OPTIONS LIST ────────────────────────────────────────── */}
      <div className="space-y-2.5">
        
        {/* Account Settings */}
        <ProfileMenuItem 
          icon={User} 
          label={language === 'ku' ? 'ڕێکخستنەکانی هەژمار' : language === 'ar' ? 'إعدادات الحساب' : 'Account Settings'} 
          onClick={() => setShowNameModal(true)} 
        />

        {/* Subscription (Free Notice) */}
        <ProfileMenuItem 
          icon={Crown} 
          label={language === 'ku' ? 'ئابوونەبوون' : language === 'ar' ? 'الاشتراك' : 'Subscription'} 
          iconClass="text-amber-400"
          onClick={() => alert(language === 'ku' ? 'ئابوونەبوون لە تابان پڵەی لەئێستادا بەخۆڕاییە بۆ سەرجەم بەکارهێنەران!' : 'Subscription is currently FREE for all users!')} 
        />

        {/* Language Selector (گۆڕینی زمان) */}
        <div className="relative">
          <button 
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="w-full flex items-center justify-between p-4 bg-[#14151c] light-mode:bg-white hover:bg-[#1c1e28] light-mode:hover:bg-neutral-50 rounded-2xl transition border border-white/6 light-mode:border-neutral-200"
          >
            <div className="flex items-center space-x-3.5 rtl:space-x-reverse">
              <Languages size={20} className="text-white/80 light-mode:text-neutral-700" />
              <span className="font-bold text-sm text-white light-mode:text-black">
                {language === 'ku' ? 'گۆڕینی زمان' : language === 'ar' ? 'تغيير اللغة' : 'Change Language'}
              </span>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="text-xs text-white/50 light-mode:text-neutral-500 uppercase font-bold">{language}</span>
              <ChevronRight size={18} className={`text-white/40 light-mode:text-neutral-400 transition-transform ${showLangMenu ? 'rotate-90' : 'rtl:rotate-180'}`} />
            </div>
          </button>
          
          {showLangMenu && (
            <div className="mt-2 bg-[#1c1e28] light-mode:bg-white border border-white/10 light-mode:border-neutral-200 rounded-2xl overflow-hidden z-50 shadow-2xl">
              <LangOption label="English" flag="🇬🇧" active={language === 'en'} onClick={() => { setLanguage('en'); setShowLangMenu(false); }} />
              <LangOption label="کوردی" flag="☀️" active={language === 'ku'} onClick={() => { setLanguage('ku'); setShowLangMenu(false); }} />
              <LangOption label="العربية" flag="🇮🇶" active={language === 'ar'} onClick={() => { setLanguage('ar'); setShowLangMenu(false); }} />
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="w-full flex items-center justify-between p-4 bg-[#14151c] light-mode:bg-white hover:bg-[#1c1e28] light-mode:hover:bg-neutral-50 rounded-2xl transition border border-white/6 light-mode:border-neutral-200"
        >
          <div className="flex items-center space-x-3.5 rtl:space-x-reverse">
            {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-600" />}
            <span className="font-bold text-sm text-white light-mode:text-black">
              {isDarkMode ? t.lightMode : t.darkMode}
            </span>
          </div>
        </button>

        <ProfileMenuItem icon={HelpCircle} label={language === 'ku' ? 'یارمەتی و پشتیوانی' : language === 'ar' ? 'المساعدة والدعم' : 'Help & Support'} />
        <ProfileMenuItem icon={Info} label={language === 'ku' ? 'دەربارەی Taban Play' : language === 'ar' ? 'حول Taban Play' : 'About Taban Play'} onClick={() => setShowAboutModal(true)} />
        <ProfileMenuItem icon={LogOut} label={t.logout} textClass="text-red-500" onClick={handleLogout} />
      </div>

      {/* ── ABOUT TABAN PLAY MODAL ───────────────────────────────── */}
      {showAboutModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => setShowAboutModal(false)}>
          <div className="bg-[#14151c] light-mode:bg-white border border-white/10 light-mode:border-neutral-200 w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b border-white/10 light-mode:border-neutral-200 pb-4">
              <div className="flex items-center gap-3">
                <Image src="/app-logo-new.png" alt="Taban Play" width={32} height={32} className="rounded-lg object-contain" unoptimized />
                <h3 className="text-lg font-extrabold text-white light-mode:text-black">Taban Play</h3>
              </div>
              <button onClick={() => setShowAboutModal(false)} className="w-8 h-8 rounded-full bg-white/10 light-mode:bg-neutral-200 flex items-center justify-center text-white/60 light-mode:text-neutral-700 hover:text-white light-mode:hover:text-black"><X size={18} /></button>
            </div>

            <div className="space-y-4 text-sm text-white/80 light-mode:text-neutral-700 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <p className="font-medium text-white light-mode:text-black">
                {aboutText || (language === 'ku' 
                  ? 'پلاتفۆرمی تابان پڵەی (Taban Play) پلاتفۆرمێکی سەردەمیانەی ژێرنووس و دۆبلاژی کوردییە بۆ سەیرکردنی نوێترین فیلم، زنجیرە، ئەنیمەیشن، و پەخشی ڕاستەوخۆی کەناڵە تەلەڤیزیۆنییەکان بە بەرزترین کوالێتی HD و بێ پچڕان.'
                  : 'Taban Play is the premier Kurdish streaming platform for movies, series, animation, and live TV channels in high definition.')}
              </p>

              <div className="space-y-2 bg-[#1c1e28] light-mode:bg-neutral-100 p-4 rounded-2xl border border-white/5 light-mode:border-neutral-200">
                <div className="flex items-center gap-2.5 text-xs text-white/90 light-mode:text-neutral-800 font-semibold">
                  <CheckCircle2 size={16} className="text-[#CC222F]" />
                  <span>{language === 'ku' ? 'نوێترین فیلم و زنجیرە ژێرنووس و دۆبلاژکراوەکان' : 'Latest dubbed & subtitled movies & series'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-white/90 light-mode:text-neutral-800 font-semibold">
                  <CheckCircle2 size={16} className="text-[#CC222F]" />
                  <span>{language === 'ku' ? 'پەخشی ڕاستەوخۆی کەناڵە ناوخۆیی و جیهانییەکان' : 'Live streaming of local & international TV channels'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-white/90 light-mode:text-neutral-800 font-semibold">
                  <CheckCircle2 size={16} className="text-[#CC222F]" />
                  <span>{language === 'ku' ? 'لێدانی خێرا بە کوالێتی Full HD / 4K' : 'Fast HD / 4K playback experience'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-white/40 light-mode:text-neutral-500 pt-2 border-t border-white/10 light-mode:border-neutral-200">
                <span>Version 2.0.0</span>
                <span>© 2026 Taban Play</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SAVED ITEMS MODAL ────────────────────────────────────── */}
      {showSavedModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => setShowSavedModal(false)}>
          <div className="bg-[#14151c] light-mode:bg-white border border-white/10 light-mode:border-neutral-200 w-full max-w-lg rounded-3xl p-6 shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b border-white/10 light-mode:border-neutral-200 pb-4">
              <div className="flex items-center gap-2.5">
                <Bookmark size={20} className="text-[#CC222F]" />
                <h3 className="text-lg font-extrabold text-white light-mode:text-black">{language === 'ku' ? 'سەیڤکراوەکان' : language === 'ar' ? 'المحفوظات' : 'Saved Items'}</h3>
              </div>
              <button onClick={() => setShowSavedModal(false)} className="w-8 h-8 rounded-full bg-white/10 light-mode:bg-neutral-200 flex items-center justify-center text-white/60 light-mode:text-neutral-700 hover:text-white light-mode:hover:text-black"><X size={18} /></button>
            </div>

            {watchlistItems.length === 0 ? (
              <div className="py-16 text-center text-white/40 light-mode:text-neutral-500 text-sm font-semibold">
                {language === 'ku' ? 'هیچ بەرهەمێک سەیڤ نەکراوە' : 'No items saved yet'}
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto pr-1">
                {watchlistItems.map((movie) => (
                  <div key={movie.id} onClick={() => { setShowSavedModal(false); navigate.push(`/?movie=${movie.id}`); }} className="bg-[#1c1e28] light-mode:bg-neutral-100 hover:bg-white/10 light-mode:hover:bg-neutral-200 p-3 rounded-2xl flex items-center justify-between cursor-pointer transition border border-white/5 light-mode:border-neutral-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-16 relative rounded-xl overflow-hidden bg-black shrink-0">
                        {movie.image ? <Image src={movie.image} alt="" fill className="object-cover" unoptimized /> : null}
                      </div>
                      <div>
                        <h4 className="font-bold text-white light-mode:text-black text-sm line-clamp-1">{getLocalized(movie, 'title', language)}</h4>
                        <p className="text-xs text-white/40 light-mode:text-neutral-500 mt-1">{movie.year || movie.type}</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#CC222F] flex items-center justify-center text-white shrink-0">
                      <Play size={14} className="ml-0.5 fill-current" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CONTINUE WATCHING MODAL ───────────────────────────────── */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => setShowHistoryModal(false)}>
          <div className="bg-[#14151c] light-mode:bg-white border border-white/10 light-mode:border-neutral-200 w-full max-w-lg rounded-3xl p-6 shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b border-white/10 light-mode:border-neutral-200 pb-4">
              <div className="flex items-center gap-2.5">
                <Clock size={20} className="text-[#CC222F]" />
                <h3 className="text-lg font-extrabold text-white light-mode:text-black">{language === 'ku' ? 'لە هەمان شوێن' : language === 'ar' ? 'متابعة المشاهدة' : 'Continue Watching'}</h3>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="w-8 h-8 rounded-full bg-white/10 light-mode:bg-neutral-200 flex items-center justify-center text-white/60 light-mode:text-neutral-700 hover:text-white light-mode:hover:text-black"><X size={18} /></button>
            </div>

            {historyItems.length === 0 ? (
              <div className="py-16 text-center text-white/40 light-mode:text-neutral-500 text-sm font-semibold">
                {language === 'ku' ? 'هیچ سەیرکردنێکی پێشوو نییە' : 'No watch history yet'}
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto pr-1">
                {historyItems.map((h: any) => (
                  <div key={h.item.id} onClick={() => { setShowHistoryModal(false); navigate.push(`/?movie=${h.item.id}&t=${Math.floor(h.timestamp)}`); }} className="bg-[#1c1e28] light-mode:bg-neutral-100 hover:bg-white/10 light-mode:hover:bg-neutral-200 p-3 rounded-2xl flex items-center justify-between cursor-pointer transition border border-white/5 light-mode:border-neutral-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-16 relative rounded-xl overflow-hidden bg-black shrink-0">
                        {h.item.image ? <Image src={h.item.image} alt="" fill className="object-cover" unoptimized /> : null}
                      </div>
                      <div>
                        <h4 className="font-bold text-white light-mode:text-black text-sm line-clamp-1">{getLocalized(h.item, 'title', language)}</h4>
                        <p className="text-xs text-[#CC222F] font-bold mt-1">
                          {language === 'ku' ? `بەردەوامبوون لە ${formatTime(h.timestamp)}` : `Resume at ${formatTime(h.timestamp)}`}
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#CC222F] flex items-center justify-center text-white shrink-0">
                      <Play size={14} className="ml-0.5 fill-current" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Name Edit Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#181924] light-mode:bg-white w-full max-w-xs rounded-2xl p-6 border border-white/10 light-mode:border-neutral-200 shadow-2xl">
            <h3 className="text-lg font-bold text-white light-mode:text-black mb-4">{t.editName}</h3>
            <input 
              type="text" 
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="w-full bg-white/7 light-mode:bg-neutral-100 border border-white/10 light-mode:border-neutral-300 rounded-xl px-4 py-2.5 text-white light-mode:text-black placeholder-white/30 light-mode:placeholder-neutral-400 outline-none focus:border-[#CC222F] mb-6 text-sm font-semibold"
              autoFocus
            />
            <div className="flex space-x-3 rtl:space-x-reverse">
              <button 
                onClick={() => setShowNameModal(false)}
                className="flex-1 py-2 bg-white/8 light-mode:bg-neutral-200 text-white/70 light-mode:text-neutral-700 rounded-xl font-bold text-sm hover:bg-white/15 light-mode:hover:bg-neutral-300 transition"
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
          <form onSubmit={handleUnlockSubmit} className="bg-[#181924] light-mode:bg-white w-full max-w-xs rounded-2xl p-6 border border-white/10 light-mode:border-neutral-200 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white light-mode:text-black">{language === 'ku' ? 'داخڵکردنی کۆد' : 'Enter Code'}</h3>
              <button type="button" onClick={() => setShowUnlockModal(false)} className="text-white/40 light-mode:text-neutral-500 hover:text-white light-mode:hover:text-black"><X size={18} /></button>
            </div>
            <p className="text-xs text-white/60 light-mode:text-neutral-600 mb-4">{language === 'ku' ? 'کۆدی چالاککردنەکە بنووسە:' : 'Please enter code:'}</p>
            <input 
              type="text" 
              value={unlockCode}
              onChange={(e) => setUnlockCode(e.target.value)}
              placeholder="Code..."
              className="w-full bg-white/7 light-mode:bg-neutral-100 border border-white/10 light-mode:border-neutral-300 rounded-xl px-4 py-2.5 text-white light-mode:text-black placeholder-white/30 light-mode:placeholder-neutral-400 outline-none focus:border-[#CC222F] mb-6 text-sm font-semibold"
              autoFocus
            />
            <div className="flex space-x-3 rtl:space-x-reverse">
              <button 
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="flex-1 py-2.5 bg-white/8 light-mode:bg-neutral-200 text-white/70 light-mode:text-neutral-700 rounded-xl font-bold text-sm hover:bg-white/15 light-mode:hover:bg-neutral-300 transition"
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

    </div>
  );
}

function LangOption({ label, flag, active, onClick }: { label: string, flag: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full text-left rtl:text-right p-3.5 hover:bg-white/5 light-mode:hover:bg-neutral-100 transition flex items-center justify-between ${active ? 'text-[#CC222F] bg-[#CC222F]/5' : 'text-white/80 light-mode:text-neutral-800'}`}
    >
      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        <span className="text-lg">{flag}</span>
        <span className="font-bold text-sm">{label}</span>
      </div>
      {active && <div className="w-2 h-2 rounded-full bg-[#CC222F]" />}
    </button>
  );
}

function ProfileMenuItem({ icon: Icon, label, iconClass = "text-white/80 light-mode:text-neutral-700", textClass = "text-white light-mode:text-black", onClick }: { icon: any, label: string, iconClass?: string, textClass?: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-[#14151c] light-mode:bg-white hover:bg-[#1c1e28] light-mode:hover:bg-neutral-50 rounded-2xl transition border border-white/6 light-mode:border-neutral-200 group"
    >
      <div className="flex items-center space-x-3.5 rtl:space-x-reverse">
        <Icon size={20} className={textClass === 'text-red-500' ? 'text-red-500' : iconClass} />
        <span className={`font-bold text-sm ${textClass}`}>{label}</span>
      </div>
      <ChevronRight size={18} className="text-white/40 light-mode:text-neutral-400 group-hover:text-white light-mode:group-hover:text-black transition-colors rtl:rotate-180" />
    </button>
  );
}
