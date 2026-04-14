import { Bell, Download, Shield, FileText, Star, LogOut, ChevronRight, Crown, LayoutDashboard, Moon, Sun, Languages, Camera, Edit2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import ProSubscriptionModal from './ProSubscriptionModal';
import { getProStatusLocal } from '../lib/pro';
import { useLanguage } from '../lib/LanguageContext';
import { Language } from '../lib/translations';

export default function Profile() {
  const navigate = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [showProModal, setShowProModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  
  const [userName, setUserName] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('user_name') || 'User Name';
    return 'User Name';
  });
  const [profileImage, setProfileImage] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('user_image') || 'https://i.pravatar.cc/150?img=11';
    return 'https://i.pravatar.cc/150?img=11';
  });
  const [tempName, setTempName] = useState(userName);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check initial theme
    if (document.documentElement.classList.contains('light-mode')) {
      setIsDarkMode(false);
    }
    
    // Check PRO status
    setIsPro(getProStatusLocal());
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

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminCode, setAdminCode] = useState('');

  const handleAdminSubmit = () => {
    if (adminCode === '400500') {
      setShowAdminModal(false);
      setAdminCode('');
      navigate.push('/admin');
    } else {
      alert('Invalid Code!');
    }
  };

  return (
    <div className="p-4 pt-8 pb-24 text-white light-mode:text-black">
      <div className="flex flex-col items-center mb-8">
        <div className="relative group">
          <div className="w-24 h-24 relative rounded-full border-2 border-red-600 overflow-hidden">
            <Image 
              src={profileImage} 
              alt="Profile" 
              fill
              className="object-cover" 
              sizes="96px"
            />
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-red-600 w-8 h-8 rounded-full flex items-center justify-center border-2 border-neutral-950 light-mode:border-white hover:bg-red-700 transition"
          >
            <Camera size={16} className="text-white" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
            accept="image/*" 
          />
        </div>
        
        <div className="flex items-center mt-4 space-x-2 rtl:space-x-reverse">
          <h2 className="text-2xl font-bold">{userName}</h2>
          <button 
            onClick={() => {
              setTempName(userName);
              setShowNameModal(true);
            }}
            className="p-1 text-neutral-500 hover:text-white transition"
          >
            <Edit2 size={16} />
          </button>
        </div>
      </div>

      <div 
        onClick={() => !isPro && setShowProModal(true)}
        className={`${isPro ? 'bg-emerald-900/20 border-emerald-900/50' : 'bg-gradient-to-r from-red-900/40 to-red-600/20 border-red-900/50 hover:from-red-900/50 hover:to-red-600/30'} border rounded-2xl p-5 mb-8 flex items-center justify-between cursor-pointer transition group`}
      >
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className={`w-12 h-12 ${isPro ? 'bg-emerald-600/20 text-emerald-500' : 'bg-red-600/20 text-red-500'} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <Crown size={24} />
          </div>
          <div>
            <h3 className={`font-semibold ${isPro ? 'text-emerald-500' : 'text-red-500'} text-lg`}>
              {isPro ? t.activated : t.becomePro}
            </h3>
            <p className="text-sm text-neutral-400 light-mode:text-neutral-600">
              {isPro ? t.premiumFeatures : t.premiumFeatures}
            </p>
          </div>
        </div>
        {!isPro && <ChevronRight size={24} className="text-red-500 rtl:rotate-180" />}
      </div>

      <div className="space-y-2">
        <button 
          onClick={toggleTheme}
          className="w-full flex items-center justify-between p-4 bg-neutral-900/30 light-mode:bg-neutral-100 hover:bg-neutral-900/80 light-mode:hover:bg-neutral-200 rounded-xl transition border border-transparent hover:border-neutral-800 light-mode:hover:border-neutral-300"
        >
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {isDarkMode ? <Sun size={22} className="text-yellow-500" /> : <Moon size={22} className="text-indigo-500" />}
            <span className="font-medium text-neutral-200 light-mode:text-neutral-800">
              {isDarkMode ? t.lightMode : t.darkMode}
            </span>
          </div>
        </button>

        <div className="relative">
          <button 
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="w-full flex items-center justify-between p-4 bg-neutral-900/30 light-mode:bg-neutral-100 hover:bg-neutral-900/80 light-mode:hover:bg-neutral-200 rounded-xl transition border border-transparent hover:border-neutral-800 light-mode:hover:border-neutral-300"
          >
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <Languages size={22} className="text-emerald-500" />
              <span className="font-medium text-neutral-200 light-mode:text-neutral-800">{t.language}</span>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="text-xs text-neutral-500 uppercase">{language}</span>
              <ChevronRight size={20} className={`text-neutral-600 transition-transform ${showLangMenu ? 'rotate-90' : 'rtl:rotate-180'}`} />
            </div>
          </button>
          
          {showLangMenu && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1d24] border border-neutral-800 rounded-xl overflow-hidden z-50 shadow-2xl animate-in slide-in-from-top-2 duration-200">
              <LangOption label="English" active={language === 'en'} onClick={() => { setLanguage('en'); setShowLangMenu(false); }} />
              <LangOption label="کوردی" active={language === 'ku'} onClick={() => { setLanguage('ku'); setShowLangMenu(false); }} />
              <LangOption label="العربية" active={language === 'ar'} onClick={() => { setLanguage('ar'); setShowLangMenu(false); }} />
            </div>
          )}
        </div>

        {/* Admin Panel Link */}
        <ProfileMenuItem 
          icon={LayoutDashboard} 
          label="Admin Panel" 
          textClass="text-blue-400"
          onClick={() => setShowAdminModal(true)}
        />
        
        <ProfileMenuItem icon={Bell} label={t.notifications} />
        <ProfileMenuItem icon={Download} label={t.downloads} />
        <ProfileMenuItem icon={Shield} label={t.privacyPolicy} />
        <ProfileMenuItem icon={FileText} label={t.termsConditions} />
        <ProfileMenuItem icon={Star} label={t.rateApp} />
        <ProfileMenuItem icon={LogOut} label={t.logout} textClass="text-red-500" onClick={handleLogout} />
      </div>

      {/* Name Edit Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a1d24] w-full max-w-xs rounded-2xl p-6 border border-neutral-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">{t.editName}</h3>
            <input 
              type="text" 
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white outline-none focus:border-red-500 mb-6"
              autoFocus
            />
            <div className="flex space-x-3 rtl:space-x-reverse">
              <button 
                onClick={() => setShowNameModal(false)}
                className="flex-1 py-2 bg-neutral-800 text-white rounded-lg font-medium hover:bg-neutral-700 transition"
              >
                {t.cancel}
              </button>
              <button 
                onClick={handleSaveName}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Code Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a1d24] w-full max-w-xs rounded-2xl p-6 border border-neutral-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Admin Access</h3>
            <p className="text-sm text-neutral-400 mb-4">Please enter the admin security code to continue.</p>
            <input 
              type="password" 
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminSubmit()}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white outline-none focus:border-red-500 mb-6"
              placeholder="Enter code..."
              autoFocus
            />
            <div className="flex space-x-3 rtl:space-x-reverse">
              <button 
                onClick={() => {
                  setShowAdminModal(false);
                  setAdminCode('');
                }}
                className="flex-1 py-2 bg-neutral-800 text-white rounded-lg font-medium hover:bg-neutral-700 transition"
              >
                {t.cancel}
              </button>
              <button 
                onClick={handleAdminSubmit}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition"
              >
                Enter
              </button>
            </div>
          </div>
        </div>
      )}

      <ProSubscriptionModal isOpen={showProModal} onClose={() => setShowProModal(false)} />
    </div>
  );
}

function LangOption({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full text-left rtl:text-right p-4 hover:bg-neutral-800 transition flex items-center justify-between ${active ? 'text-emerald-500 bg-emerald-500/5' : 'text-neutral-300'}`}
    >
      <span className="font-medium">{label}</span>
      {active && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
    </button>
  );
}

function ProfileMenuItem({ icon: Icon, label, textClass = "text-neutral-200 light-mode:text-neutral-800", onClick }: { icon: any, label: string, textClass?: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-neutral-900/30 light-mode:bg-neutral-100 hover:bg-neutral-900/80 light-mode:hover:bg-neutral-200 rounded-xl transition border border-transparent hover:border-neutral-800 light-mode:hover:border-neutral-300"
    >
      <div className="flex items-center space-x-4 rtl:space-x-reverse">
        <Icon size={22} className={textClass === 'text-red-500' ? 'text-red-500' : textClass === 'text-blue-400' ? 'text-blue-400' : 'text-neutral-400 light-mode:text-neutral-600'} />
        <span className={`font-medium ${textClass}`}>{label}</span>
      </div>
      <ChevronRight size={20} className="text-neutral-600 light-mode:text-neutral-400 rtl:rotate-180" />
    </button>
  );
}
