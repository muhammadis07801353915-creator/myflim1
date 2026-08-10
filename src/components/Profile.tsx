'use client';

import { 
  User, 
  ChevronRight, 
  ChevronLeft,
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
  CheckCircle2,
  Check,
  Upload,
  MessageSquare,
  Send,
  Loader2,
  LayoutGrid,
  Trash2
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '../lib/LanguageContext';
import { getLocalized } from '../lib/translations';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { getUserAccount, UserAccount, DEFAULT_AVATARS, logoutUserAccount } from '../lib/userAuth';
const KurdistanFlag = () => (
  <div className="w-8 h-5 rounded overflow-hidden border border-black/20 flex flex-col relative shadow-sm shrink-0">
    <div className="h-1/3 bg-[#ED1C24]" />
    <div className="h-1/3 bg-white flex items-center justify-center relative">
      <div className="w-2 h-2 rounded-full bg-[#FECE00] flex items-center justify-center relative">
        <div className="absolute w-3 h-3 rounded-full border border-[#FECE00]/70" />
      </div>
    </div>
    <div className="h-1/3 bg-[#1E9D47]" />
  </div>
);

const IraqFlag = () => (
  <div className="w-8 h-5 rounded overflow-hidden border border-black/20 flex flex-col relative shadow-sm shrink-0">
    <div className="h-1/3 bg-[#CE1126]" />
    <div className="h-1/3 bg-white flex items-center justify-center">
      <span className="text-[7px] font-black text-[#007A3D] leading-none">الله أكبر</span>
    </div>
    <div className="h-1/3 bg-black" />
  </div>
);

interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  message: string;
  sender: 'user' | 'admin';
  created_at: string;
}

export default function Profile() {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useRouter();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [aboutText, setAboutText] = useState('');

  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [tempName, setTempName] = useState('User');
  const [tempAvatar, setTempAvatar] = useState(DEFAULT_AVATARS[0]);

  const [isDarkMode, setIsDarkMode] = useState(true);

  const [watchlistItems, setWatchlistItems] = useState<any[]>([]);
  const [historyItems, setHistoryItems] = useState<any[]>([]);

  // Live Chat States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    syncUser();

    const handleUserUpdate = () => syncUser();
    window.addEventListener('userAccountUpdated', handleUserUpdate);

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
      window.removeEventListener('userAccountUpdated', handleUserUpdate);
      window.removeEventListener('storage', loadState);
      window.removeEventListener('watchlistUpdated', loadState);
      window.removeEventListener('historyUpdated', loadState);
    };
  }, []);

  const syncUser = () => {
    const acc = getUserAccount();
    setUserAccount(acc);
    if (acc) {
      setTempName(acc.name);
      setTempAvatar(acc.avatar);
    }
  };

  // Fetch & sync persistent Live Chat Messages
  useEffect(() => {
    if (!userAccount) return;

    const storageKey = `myfilm_chat_history_${userAccount.id}`;

    const fetchChatMessages = async () => {
      try {
        let msgs: ChatMessage[] = [];

        // 1. Load local persistent cache first
        try {
          const cached = localStorage.getItem(storageKey);
          if (cached) {
            msgs = JSON.parse(cached);
          }
        } catch (e) {
          console.warn(e);
        }

        // 2. Fetch from Supabase settings table (100% working table with key 'taban_live_support_chats')
        const { data: setRes } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'taban_live_support_chats')
          .maybeSingle();

        if (setRes?.value) {
          try {
            const parsed = JSON.parse(setRes.value);
            if (Array.isArray(parsed)) {
              // Match by user_id (real ID) OR user_id === username OR user_name === username
              // This catches admin replies where user_id is set to the username string
              const userFiltered = parsed.filter((m: any) =>
                m.user_id === userAccount.id ||
                m.user_id === userAccount.name ||
                m.user_name === userAccount.name
              );
              userFiltered.forEach((m: any) => {
                if (!msgs.some(x => x.message === m.message && x.created_at === m.created_at)) {
                  msgs.push(m as ChatMessage);
                }
              });
            }
          } catch (e) {
            // ignore
          }
        }

        // 3. Fallback query support_messages
        const { data } = await supabase
          .from('support_messages')
          .select('*')
          .eq('user_id', userAccount.id)
          .order('created_at', { ascending: true });

        if (data && data.length > 0) {
          data.forEach((m: any) => {
            if (!msgs.some(x => x.message === m.message && x.created_at === m.created_at)) {
              msgs.push(m as ChatMessage);
            }
          });
        }

        msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setChatMessages(msgs);
        localStorage.setItem(storageKey, JSON.stringify(msgs));
      } catch (e) {
        console.warn(e);
      }
    };

    fetchChatMessages();

    // Poll every 3 seconds so admin replies appear instantly for the user
    const pollInterval = setInterval(() => {
      fetchChatMessages();
    }, 3000);

    // Subscribe to real-time additions on settings table
    const channel = supabase
      .channel(`user_chat_settings_${userAccount.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings', filter: 'key=eq.taban_live_support_chats' },
        () => fetchChatMessages()
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [showChatModal, userAccount]);

  useEffect(() => {
    if (showChatModal) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChatModal]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingChat || !userAccount) return;

    const text = chatInput.trim();
    setChatInput('');
    setSendingChat(true);

    const newMsgObj: Omit<ChatMessage, 'id'> = {
      user_id: userAccount.id,
      user_name: userAccount.name,
      user_avatar: userAccount.avatar,
      message: text,
      sender: 'user',
      created_at: new Date().toISOString()
    };

    const tempId = 'msg_' + Date.now();
    const fullMsgObj: ChatMessage = { id: tempId, ...newMsgObj };

    // Update local state and persistent localStorage immediately
    const storageKey = `myfilm_chat_history_${userAccount.id}`;
    setChatMessages((prev) => {
      const updated = [...prev, fullMsgObj];
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });

    try {
      // 1. Fetch existing chats list from settings table
      const { data: setRes } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'taban_live_support_chats')
        .maybeSingle();

      let existingList: any[] = [];
      if (setRes?.value) {
        try {
          const parsed = JSON.parse(setRes.value);
          if (Array.isArray(parsed)) existingList = parsed;
        } catch (e) {}
      }

      existingList.push(fullMsgObj);

      // 2. Update settings table with full array (100% works without schema or constraint errors)
      const jsonVal = JSON.stringify(existingList);
      const { error } = await supabase
        .from('settings')
        .update({ value: jsonVal })
        .eq('key', 'taban_live_support_chats');

      if (error) {
        await supabase.from('settings').insert([{ key: 'taban_live_support_chats', value: jsonVal }]);
      }

      // 3. Secondary insert into support_messages if present
      await supabase.from('support_messages').insert([newMsgObj]);
    } catch (err) {
      console.error(err);
    } finally {
      setSendingChat(false);
    }
  };

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

  const handleSaveProfile = async () => {
    if (tempName.trim()) {
      localStorage.setItem('myfilm_user_name', tempName.trim());
    }
    if (tempAvatar) {
      localStorage.setItem('myfilm_user_avatar', tempAvatar);
    }
    syncUser();
    setShowNameModal(false);

    if (userAccount) {
      try {
        await supabase.from('profiles').upsert({
          id: userAccount.id,
          display_name: tempName.trim(),
          avatar_url: tempAvatar,
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(language === 'ku' ? 'تکایە وێنەیەک هەڵبژێرە کە لە 5 مێگابایت بچووکتر بێت' : 'File must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setTempAvatar(reader.result.toString());
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    if (confirm(language === 'ku' ? 'دڵنیایت لە چوونه‌ده‌ره‌وه‌؟' : 'Are you sure you want to log out?')) {
      logoutUserAccount();
      setUserAccount(null);
    }
  };

  const removeFromSaved = (movieId: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = watchlistItems.filter((m: any) => String(m.id) !== String(movieId));
    setWatchlistItems(updated);
    localStorage.setItem('myfilm_watchlist', JSON.stringify(updated));
    window.dispatchEvent(new Event('watchlistUpdated'));
  };

  const removeFromHistory = (movieId: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const hist = JSON.parse(localStorage.getItem('myfilm_history') || '{}');
    delete hist[movieId];
    delete hist[String(movieId)];
    localStorage.setItem('myfilm_history', JSON.stringify(hist));
    setHistoryItems(Object.values(hist).sort((a: any, b: any) => b.updatedAt - a.updatedAt));
    window.dispatchEvent(new Event('historyUpdated'));
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 5) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const h = Math.floor(m / 60);
    const remM = m % 60;
    if (h > 0) {
      return `${h}:${remM < 10 ? '0' : ''}${remM}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="p-4 md:p-8 pt-8 max-w-xl mx-auto pb-32 text-white light-mode:text-black">
      
      {/* ── TOP PROFILE HEADER (Avatar & Name & Edit Button) ────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-5 sm:gap-6 rtl:gap-5">
          <div className="relative p-0.5 rounded-full border-2 border-red-500/80 light-mode:border-[#CC222F]">
            <div className="w-16 h-16 rounded-full overflow-hidden relative bg-[#181924] light-mode:bg-neutral-200">
              <Image 
                src={userAccount?.avatar || DEFAULT_AVATARS[0]} 
                alt={userAccount?.name || 'User'} 
                fill 
                className="object-cover"
                unoptimized
              />
            </div>
            <button 
              onClick={() => {
                if (!userAccount) {
                  setShowAuthModal(true);
                } else {
                  setTempName(userAccount.name);
                  setTempAvatar(userAccount.avatar);
                  setShowNameModal(true);
                }
              }}
              className="absolute -bottom-1 -right-1 rtl:-right-auto rtl:-left-1 w-6 h-6 rounded-full bg-[#CC222F] text-white flex items-center justify-center border-2 border-[#0F0F13] light-mode:border-white hover:scale-110 transition shadow-md"
            >
              <Camera size={11} />
            </button>
          </div>
          <div>
            <h1 className="text-xl font-black text-white light-mode:text-black tracking-tight">
              {userAccount 
                ? (language === 'ku' ? `سڵاو، ${userAccount.name}` : language === 'ar' ? `مرحباً، ${userAccount.name}` : `Hi, ${userAccount.name}`)
                : (language === 'ku' ? 'سڵاو تابان پڵەی' : language === 'ar' ? 'مرحباً تابان بلاي' : 'Hello Taban Play')
              }
            </h1>
            <button 
              onClick={() => {
                if (!userAccount) {
                  setShowAuthModal(true);
                } else {
                  setTempName(userAccount.name);
                  setTempAvatar(userAccount.avatar);
                  setShowNameModal(true);
                }
              }} 
              className="text-xs font-bold text-red-400 light-mode:text-[#CC222F] hover:underline transition flex items-center gap-1 mt-1"
            >
              <span>{userAccount ? (language === 'ku' ? 'دەستکاری پرۆفایل >' : 'Edit Profile >') : (language === 'ku' ? 'دروستکردنی ئەکاونت / چوونە ژوورەوە >' : 'Register Account / Login >')}</span>
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
            <Bookmark size={18} className="text-red-400 light-mode:text-[#CC222F]" />
            <div className="w-[18px] h-[18px] rounded-full bg-red-500/15 light-mode:bg-[#CC222F]/15 flex items-center justify-center text-red-400 light-mode:text-[#CC222F] font-black text-[10px]">
              +
            </div>
          </div>
          <p className="text-[11px] font-semibold text-white/60 light-mode:text-neutral-500 mb-1 truncate">{language === 'ku' ? 'سەیڤکراو' : language === 'ar' ? 'المحفوظات' : 'Saved'}</p>
          <p className="text-2xl font-black text-white light-mode:text-black tracking-tight">{watchlistItems.length}</p>
        </div>

        {/* Card 2: History / Resume Playback */}
        <div 
          onClick={() => setShowHistoryModal(true)} 
          className="bg-[#14151c] light-mode:bg-white hover:bg-[#1a1b24] light-mode:hover:bg-neutral-50 border border-white/6 light-mode:border-neutral-200 rounded-2xl p-4 cursor-pointer transition shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <Clock size={18} className="text-red-400 light-mode:text-[#CC222F]" />
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
            <Download size={18} className="text-red-400 light-mode:text-[#CC222F]" />
            <div className="w-[18px] h-[18px] rounded-full bg-red-500/15 light-mode:bg-[#CC222F]/15 flex items-center justify-center text-red-400 light-mode:text-[#CC222F] font-black text-[10px]">
              +
            </div>
          </div>
          <p className="text-[11px] font-semibold text-white/60 light-mode:text-neutral-500 mb-1 truncate">{language === 'ku' ? 'دابەزاندن' : language === 'ar' ? 'التنزيلات' : 'Downloads'}</p>
          <p className="text-xs font-extrabold text-red-400 light-mode:text-[#CC222F] mt-2">{language === 'ku' ? 'بەمزوانە' : language === 'ar' ? 'قريباً' : 'Coming Soon'}</p>
        </div>
      </div>

      {/* ── ENTER CODE / PRO BANNER (SHOWN ONLY WHEN NOT LOGGED IN) ────── */}
      {!userAccount && (
        <div 
          onClick={() => setShowAuthModal(true)}
          className="mb-6 p-4 rounded-2xl bg-[#181924] light-mode:bg-white border border-red-500/30 light-mode:border-neutral-200 shadow-md flex items-center justify-between cursor-pointer hover:border-red-500/60 transition group"
        >
          <div className="flex items-center gap-4 sm:gap-5 rtl:gap-4">
            <div className="w-11 h-11 rounded-full bg-red-500/15 light-mode:bg-[#CC222F]/10 flex items-center justify-center text-red-400 light-mode:text-[#CC222F]">
              <Key size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-red-400 light-mode:text-[#CC222F]">
                {language === 'ku' ? 'داخڵکردنی کۆد (Taban Play1)' : 'Enter Code (Taban Play1)'}
              </h3>
              <p className="text-xs text-white/50 light-mode:text-neutral-600 mt-0.5">
                {language === 'ku' ? 'کۆدەکە بنووسە یان چوونە ژوورەوە بکە بۆ دروستکردنی ئەکاونت' : 'Enter code or log in to create account'}
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-red-400 light-mode:text-[#CC222F] rtl:rotate-180 group-hover:translate-x-1 transition-transform" />
        </div>
      )}

      {/* ── MENU OPTIONS LIST ────────────────────────────────────────── */}
      <div className="space-y-2.5">
        
        {/* Account Settings */}
        <ProfileMenuItem 
          icon={User} 
          label={language === 'ku' ? 'ڕێکخستنەکانی هەژمار' : language === 'ar' ? 'إعدادات الحساب' : 'Account Settings'} 
          onClick={() => {
            if (!userAccount) {
              setShowAuthModal(true);
            } else {
              setTempName(userAccount.name);
              setTempAvatar(userAccount.avatar);
              setShowNameModal(true);
            }
          }} 
        />

        {/* Language Selector (گۆڕینی زمان) */}
        <div className="relative">
          <button 
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="w-full flex items-center justify-between p-4 bg-[#14151c] light-mode:bg-white hover:bg-[#1c1e28] light-mode:hover:bg-neutral-50 rounded-2xl transition border border-white/6 light-mode:border-neutral-200"
          >
            <div className="flex items-center gap-4 sm:gap-5 rtl:gap-4">
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
          
          {/* Web Language Selection Modal matching Image 2 */}
          <AnimatePresence>
            {showLangMenu && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
                onClick={() => setShowLangMenu(false)}
              >
                <motion.div
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '100%', opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="bg-[#14151c] light-mode:bg-white border-t sm:border border-white/10 light-mode:border-neutral-200 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Sheet Handle */}
                  <div className="w-9 h-1 bg-white/20 light-mode:bg-neutral-300 rounded-full mx-auto mb-4"></div>

                  {/* Header Row: Back Arrow + Centered Title */}
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={() => setShowLangMenu(false)}
                      className="w-9 h-9 rounded-full bg-white/5 light-mode:bg-neutral-100 hover:bg-white/10 text-white light-mode:text-black flex items-center justify-center border border-white/10 light-mode:border-neutral-200 transition"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <h3 className="text-lg font-bold text-white light-mode:text-black text-center flex-1">
                      {language === 'ku' ? 'هەڵبژاردنی زمان' : language === 'ar' ? 'اختيار اللغة' : 'Select Language'}
                    </h3>
                    <div className="w-9"></div>
                  </div>

                  {/* Options List Matching Image 2 */}
                  <div className="space-y-3">
                    {/* 1. Kurdish Sorani */}
                    <button
                      onClick={() => { setLanguage('ku'); setShowLangMenu(false); }}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        language === 'ku'
                          ? 'bg-red-500/10 light-mode:bg-red-50 border-[#CC222F]'
                          : 'bg-white/5 light-mode:bg-neutral-100 border-white/5 light-mode:border-neutral-200 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          language === 'ku' ? 'bg-[#CC222F] text-white' : 'bg-white/10 light-mode:bg-neutral-200'
                        }`}>
                          {language === 'ku' && <Check size={13} strokeWidth={3} />}
                        </div>
                        <span className={`font-bold text-base ${language === 'ku' ? 'text-[#CC222F]' : 'text-white light-mode:text-black'}`}>
                          کوردی (سۆرانی)
                        </span>
                      </div>
                      <KurdistanFlag />
                    </button>

                    {/* 2. Kurdish Badini */}
                    <button
                      onClick={() => { setLanguage('ku'); setShowLangMenu(false); }}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 light-mode:bg-neutral-100 border border-white/5 light-mode:border-neutral-200 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="w-6 h-6 rounded-full bg-white/10 light-mode:bg-neutral-200"></div>
                        <span className="font-bold text-base text-white light-mode:text-black">
                          کوردی (بادینی)
                        </span>
                      </div>
                      <KurdistanFlag />
                    </button>

                    {/* 3. Arabic */}
                    <button
                      onClick={() => { setLanguage('ar'); setShowLangMenu(false); }}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        language === 'ar'
                          ? 'bg-red-500/10 light-mode:bg-red-50 border-[#CC222F]'
                          : 'bg-white/5 light-mode:bg-neutral-100 border-white/5 light-mode:border-neutral-200 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          language === 'ar' ? 'bg-[#CC222F] text-white' : 'bg-white/10 light-mode:bg-neutral-200'
                        }`}>
                          {language === 'ar' && <Check size={13} strokeWidth={3} />}
                        </div>
                        <span className={`font-bold text-base ${language === 'ar' ? 'text-[#CC222F]' : 'text-white light-mode:text-black'}`}>
                          العربية
                        </span>
                      </div>
                      <IraqFlag />
                    </button>

                    {/* 4. English */}
                    <button
                      onClick={() => { setLanguage('en'); setShowLangMenu(false); }}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        language === 'en'
                          ? 'bg-red-500/10 light-mode:bg-red-50 border-[#CC222F]'
                          : 'bg-white/5 light-mode:bg-neutral-100 border-white/5 light-mode:border-neutral-200 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          language === 'en' ? 'bg-[#CC222F] text-white' : 'bg-white/10 light-mode:bg-neutral-200'
                        }`}>
                          {language === 'en' && <Check size={13} strokeWidth={3} />}
                        </div>
                        <span className={`font-bold text-base ${language === 'en' ? 'text-[#CC222F]' : 'text-white light-mode:text-black'}`}>
                          English
                        </span>
                      </div>
                      <span className="text-xl">🇬🇧</span>
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Toggle (Night / Day Mode) */}
        <ProfileMenuItem 
          icon={isDarkMode ? Moon : Sun} 
          label={isDarkMode 
            ? (language === 'ku' ? 'دۆخی شەو (تاریک)' : language === 'ar' ? 'الوضع الليلي' : 'Night Mode') 
            : (language === 'ku' ? 'دۆخی ڕۆژ (ڕووناک)' : language === 'ar' ? 'الوضع النهار' : 'Day Mode')
          } 
          iconClass={isDarkMode ? "text-indigo-400" : "text-amber-400"}
          onClick={toggleTheme} 
        />

        {/* Chat with Admin (قسەکردن لەگەڵ ئادمین) */}
        <ProfileMenuItem 
          icon={MessageSquare} 
          label={language === 'ku' ? 'قسەکردن لەگەڵ ئادمین' : language === 'ar' ? 'التحدث مع الأدمن' : 'Chat with Admin'} 
          iconClass="text-red-500"
          onClick={() => {
            if (!userAccount) {
              setShowAuthModal(true);
            } else {
              setShowChatModal(true);
            }
          }} 
        />

        {/* About Taban Play */}
        <ProfileMenuItem 
          icon={Info} 
          label={language === 'ku' ? 'دەربارەی Taban Play' : language === 'ar' ? 'حول Taban Play' : 'About Taban Play'} 
          onClick={() => setShowAboutModal(true)} 
        />

        {/* Logout */}
        {userAccount && (
          <ProfileMenuItem 
            icon={LogOut} 
            label={language === 'ku' ? 'چوونە دەرەوە' : language === 'ar' ? 'تسجيل الخروج' : 'Log Out'} 
            iconClass="text-red-500"
            textClass="text-red-500"
            onClick={handleLogout} 
          />
        )}
      </div>

      {/* ── LIVE CHAT WITH ADMIN MODAL ────────────────────────────────── */}
      {showChatModal && userAccount && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4" onClick={() => setShowChatModal(false)}>
          <div className="bg-[#14151c] light-mode:bg-white border border-white/10 light-mode:border-neutral-200 w-full max-w-lg h-[80vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-4 bg-[#181924] light-mode:bg-neutral-100 border-b border-white/10 light-mode:border-neutral-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#CC222F]/20 text-[#CC222F] flex items-center justify-center font-bold">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white light-mode:text-black">
                    {language === 'ku' ? 'قسەکردن لەگەڵ ئادمین' : language === 'ar' ? 'التحدث مع الأدمن' : 'Chat with Admin'}
                  </h3>
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{language === 'ku' ? `سەرخەتە (${userAccount.name})` : `Online (${userAccount.name})`}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowChatModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 light-mode:bg-neutral-200 flex items-center justify-center text-white/60 light-mode:text-neutral-700 hover:text-white light-mode:hover:text-black transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0a0a0f] light-mode:bg-neutral-50">
              {chatMessages.length === 0 ? (
                <div className="py-20 text-center text-white/40 light-mode:text-neutral-600 space-y-2">
                  <MessageSquare size={36} className="mx-auto text-white/20 light-mode:text-neutral-400" />
                  <p className="text-sm font-bold text-white light-mode:text-black">{language === 'ku' ? `سڵاو ${userAccount.name}! پەیامێک بنووسە بۆ ئادمین` : `Hi ${userAccount.name}! Send a message to the admin`}</p>
                  <p className="text-xs text-white/40 light-mode:text-neutral-500">{language === 'ku' ? 'بە زووترین کات وەڵامت دەدرێتەوە' : 'We will reply as soon as possible'}</p>
                </div>
              ) : (
                chatMessages.map((msg, index) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div key={msg.id || index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs font-medium space-y-1 shadow-md ${
                        isUser
                          ? 'bg-[#CC222F] text-white rounded-br-none'
                          : 'bg-[#181924] light-mode:bg-white text-white light-mode:text-black border border-white/10 light-mode:border-neutral-200 rounded-bl-none'
                      }`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                        <p className={`text-[9px] text-right ${isUser ? 'text-white/70' : 'text-white/40 light-mode:text-neutral-400'}`}>
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChatMessage} className="p-3 bg-[#181924] light-mode:bg-white border-t border-white/10 light-mode:border-neutral-200 flex items-center gap-3 shrink-0 rtl:flex-row-reverse">
              <input
                type="text"
                dir={language === 'ku' || language === 'ar' ? 'rtl' : 'ltr'}
                placeholder={language === 'ku' ? 'پەیامەکەت بنووسە...' : language === 'ar' ? 'اكتب رسالتك...' : 'Type a message...'}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-white/7 light-mode:bg-neutral-100 border border-white/10 light-mode:border-neutral-300 rounded-2xl px-4 py-3 text-xs text-white light-mode:text-black placeholder-white/40 light-mode:placeholder-neutral-500 outline-none focus:border-[#CC222F] ltr:text-left rtl:text-right"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || sendingChat}
                className="w-10 h-10 bg-[#CC222F] hover:bg-red-700 disabled:opacity-50 text-white rounded-2xl transition shadow-md shrink-0 flex items-center justify-center"
              >
                {sendingChat ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="rtl:rotate-180" />}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ── SAVED ITEMS MODAL ────────────────────────────────────────── */}
      {showSavedModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => setShowSavedModal(false)}>
          <div className="bg-[#14151c] light-mode:bg-white border border-white/10 light-mode:border-neutral-200 w-full max-w-lg rounded-3xl p-6 shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b border-white/10 light-mode:border-neutral-200 pb-4">
              <div className="flex items-center gap-2.5">
                <Bookmark size={20} className="text-[#CC222F]" />
                <h3 className="text-lg font-extrabold text-white light-mode:text-black">{language === 'ku' ? 'سەیڤکراو' : language === 'ar' ? 'المحفوظات' : 'Saved Items'}</h3>
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
                  <div key={movie.id} onClick={() => { setShowSavedModal(false); navigate.push(`/?movie=${movie.id}`); }} className="modal-list-item p-3 rounded-2xl flex items-center justify-between cursor-pointer transition border group">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-16 relative rounded-xl overflow-hidden bg-black shrink-0">
                        {movie.image ? <Image src={movie.image} alt="" fill className="object-cover" unoptimized /> : null}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm line-clamp-1">{getLocalized(movie, 'title', language)}</h4>
                        <p className="text-xs text-white/40 mt-1">{movie.year || movie.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="play-btn-circle w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md">
                        <Play size={14} className="ml-0.5" />
                      </div>
                      <button 
                        onClick={(e) => removeFromSaved(movie.id, e)}
                        className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/25 text-red-400 flex items-center justify-center border border-red-500/30 transition"
                        title={language === 'ku' ? 'سڕینەوە' : 'Delete'}
                      >
                        <Trash2 size={14} />
                      </button>
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
                <Clock size={20} className="text-red-400" />
                <h3 className="text-lg font-extrabold text-white">{language === 'ku' ? 'لە هەمان شوێن' : language === 'ar' ? 'متابعة المشاهدة' : 'Continue Watching'}</h3>
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
                  <div key={h.item.id} onClick={() => { setShowHistoryModal(false); navigate.push(`/?movie=${h.item.id}&t=${Math.floor(h.timestamp)}`); }} className="modal-list-item p-3 rounded-2xl flex items-center justify-between cursor-pointer transition border group">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-16 relative rounded-xl overflow-hidden bg-black shrink-0">
                        {h.item.image ? <Image src={h.item.image} alt="" fill className="object-cover" unoptimized /> : null}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm line-clamp-1">{getLocalized(h.item, 'title', language)}</h4>
                        <p className="text-xs text-red-400 font-bold mt-1">
                          {language === 'ku' ? `بەردەوامبوون لە ${formatTime(h.timestamp)}` : `Resume at ${formatTime(h.timestamp)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="play-btn-circle w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md">
                        <Play size={14} className="ml-0.5" />
                      </div>
                      <button 
                        onClick={(e) => removeFromHistory(h.item.id, e)}
                        className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/25 text-red-400 flex items-center justify-center border border-red-500/30 transition"
                        title={language === 'ku' ? 'سڕینەوە' : 'Delete'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EDIT PROFILE MODAL (Name + Avatar Upload & Select) ────────── */}
      {showNameModal && userAccount && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowNameModal(false)}>
          <div className="bg-[#181924] light-mode:bg-white w-full max-w-sm rounded-3xl p-6 border border-white/10 light-mode:border-neutral-200 shadow-2xl space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 light-mode:border-neutral-200 pb-3">
              <h3 className="text-lg font-bold text-white light-mode:text-black">
                {language === 'ku' ? 'دەستکاری پرۆفایل' : language === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}
              </h3>
              <button onClick={() => setShowNameModal(false)} className="w-8 h-8 rounded-full bg-white/10 light-mode:bg-neutral-200 flex items-center justify-center text-white/60 light-mode:text-neutral-700 hover:text-white light-mode:hover:text-black">
                <X size={18} />
              </button>
            </div>

            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group cursor-pointer">
                <div className="w-20 h-20 rounded-full overflow-hidden relative border-2 border-[#CC222F] bg-[#14151c] shadow-lg">
                  <Image 
                    src={tempAvatar} 
                    alt={tempName} 
                    fill 
                    className="object-cover" 
                    unoptimized 
                  />
                </div>
                <label className="absolute inset-0 rounded-full bg-black/60 opacity-90 sm:opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition text-white text-[10px] font-bold">
                  <Upload size={18} className="mb-0.5" />
                  <span>{language === 'ku' ? 'گۆڕین' : 'Upload'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>

              <p className="text-xs text-white/50 light-mode:text-neutral-500 font-semibold">
                {language === 'ku' ? 'وێنەیەک لێرەوە یان لە دیارکراوەکان هەڵبژێرە' : 'Select or upload an avatar'}
              </p>

              {/* Preset Avatars Grid */}
              <div className="flex items-center gap-2.5 overflow-x-auto max-w-full pb-1 scrollbar-hide">
                {DEFAULT_AVATARS.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTempAvatar(av)}
                    className={`w-10 h-10 rounded-full overflow-hidden relative border-2 shrink-0 transition ${
                      tempAvatar === av ? 'border-[#CC222F] scale-110 shadow-md ring-2 ring-[#CC222F]/50' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image src={av} alt="" fill className="object-cover" unoptimized />
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-xs font-bold text-white/70 light-mode:text-neutral-700 mb-1.5">
                {language === 'ku' ? 'ناوی بەکارهێنەر' : language === 'ar' ? 'اسم المستخدم' : 'Display Name'}
              </label>
              <input 
                type="text" 
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="w-full bg-white/7 light-mode:bg-neutral-100 border border-white/10 light-mode:border-neutral-300 rounded-xl px-4 py-2.5 text-white light-mode:text-black placeholder-white/30 light-mode:placeholder-neutral-400 outline-none focus:border-[#CC222F] text-sm font-semibold"
                autoFocus
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3 rtl:space-x-reverse pt-2">
              <button 
                onClick={() => setShowNameModal(false)}
                className="flex-1 py-2.5 bg-white/8 light-mode:bg-neutral-200 text-white/70 light-mode:text-neutral-700 rounded-xl font-bold text-sm hover:bg-white/15 light-mode:hover:bg-neutral-300 transition"
              >
                {t.cancel}
              </button>
              <button 
                onClick={handleSaveProfile}
                className="flex-1 py-2.5 bg-[#CC222F] text-white rounded-xl font-bold text-sm hover:bg-red-700 transition shadow-lg shadow-red-600/30"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth / Account Register & Login Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => syncUser()}
      />

      {/* About Taban Play Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowAboutModal(false)}>
          <div className="bg-[#181924] light-mode:bg-white w-full max-w-sm rounded-3xl p-6 border border-white/10 light-mode:border-neutral-200 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 light-mode:border-neutral-200 pb-3">
              <h3 className="text-lg font-bold text-white light-mode:text-black">
                {language === 'ku' ? 'دەربارەی Taban Play' : language === 'ar' ? 'حول Taban Play' : 'About Taban Play'}
              </h3>
              <button onClick={() => setShowAboutModal(false)} className="w-8 h-8 rounded-full bg-white/10 light-mode:bg-neutral-200 flex items-center justify-center text-white/60 light-mode:text-neutral-700 hover:text-white light-mode:hover:text-black">
                <X size={18} />
              </button>
            </div>

            <div className="text-xs text-white/80 light-mode:text-neutral-700 leading-relaxed max-h-60 overflow-y-auto space-y-2">
              {aboutText ? (
                <p className="whitespace-pre-line font-medium">{aboutText}</p>
              ) : (
                <>
                  <p className="font-semibold">
                    {language === 'ku' 
                      ? 'تابان پڵەی (Taban Play) پڕۆژەیەکی سەردەمیی پلاتفۆرمی میدیاییە بۆ بینینی فیلم، زنجیرە، ئەنیمەیشن و پەخشی ڕاستەوخۆی کەناڵەکان بە کوالێتی بەرز.'
                      : 'Taban Play is a modern media platform for streaming movies, series, animation, and live TV channels.'}
                  </p>
                  <p>
                    {language === 'ku'
                      ? 'ئامانجمان بەخشینی باشترین ئەزموونی سەیری سینەمایی و کات بەسەربردنە بە هەردوو زمانی کوردی و عەرەبی و ئینگلیزی.'
                      : 'Our mission is to provide the best cinema and live streaming experience.'}
                  </p>
                </>
              )}
            </div>

            <div className="pt-2 border-t border-white/10 light-mode:border-neutral-200 flex justify-between items-center text-[11px] text-white/40 light-mode:text-neutral-500 font-bold">
              <span>Taban Play v2.4.0</span>
              <span>© 2026 All Rights Reserved</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function ProfileMenuItem({ 
  icon: Icon, 
  label, 
  onClick, 
  iconClass = "text-white/80 light-mode:text-neutral-700",
  textClass = "text-white light-mode:text-black"
}: { 
  icon: any; 
  label: string; 
  onClick: () => void; 
  iconClass?: string;
  textClass?: string;
}) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-[#14151c] light-mode:bg-white hover:bg-[#1c1e28] light-mode:hover:bg-neutral-50 rounded-2xl transition border border-white/6 light-mode:border-neutral-200"
    >
      <div className="flex items-center gap-4 sm:gap-5 rtl:gap-4">
        <Icon size={20} className={iconClass} />
        <span className={`font-bold text-sm ${textClass}`}>{label}</span>
      </div>
      <ChevronRight size={18} className="text-white/40 light-mode:text-neutral-400 rtl:rotate-180" />
    </button>
  );
}
