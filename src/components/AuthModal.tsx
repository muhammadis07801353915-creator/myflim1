'use client';

import { useState } from 'react';
import { X, Key, User, CheckCircle2, UserPlus, LogIn, AlertCircle, Lock } from 'lucide-react';
import { registerUserAccount, loginUserAccount } from '../lib/userAuth';
import { useLanguage } from '../lib/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'register' | 'login'>('register');
  
  // Registration States
  const [code, setCode] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  // Login States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    const res = await registerUserAccount({
      code,
      username: registerUsername,
      password: registerPassword
    });

    setSubmitting(false);

    if (res.success) {
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setErrorMessage(res.message || 'هەڵەیەک ڕوویدا');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    const res = await loginUserAccount({
      username: loginUsername,
      password: loginPassword
    });

    setSubmitting(false);

    if (res.success) {
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setErrorMessage(res.message || 'هەڵەیەک ڕوویدا');
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
      <div className="bg-[#181924] light-mode:bg-white border border-white/10 light-mode:border-neutral-200 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-5" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 light-mode:border-neutral-200 pb-3">
          <h3 className="text-lg font-bold text-white light-mode:text-black">
            {activeTab === 'register' 
              ? (language === 'ku' ? 'دروستکردنی ئەکاونتی نوێ' : 'Create New Account') 
              : (language === 'ku' ? 'چوونە ژوورەوە بۆ ئەکاونت' : 'Log In to Account')
            }
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 light-mode:bg-neutral-200 flex items-center justify-center text-white/60 light-mode:text-neutral-700 hover:text-white light-mode:hover:text-black transition">
            <X size={18} />
          </button>
        </div>

        {/* Top Notice Banner */}
        <div className="p-3.5 rounded-2xl bg-[#CC222F]/15 border border-[#CC222F]/40 text-xs font-bold text-[#CC222F] flex items-start gap-2.5">
          <Key size={18} className="shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {language === 'ku' 
              ? 'تکایە ئەو کۆدە داخل بکە لە بەشی داخڵ کردنی کۆد: Taban Play1' 
              : 'Please enter this code in code entry section: Taban Play1'}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 light-mode:bg-neutral-100 rounded-2xl border border-white/5 light-mode:border-neutral-200">
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setErrorMessage(''); }}
            style={{ color: activeTab === 'register' ? '#ffffff' : undefined }}
            className={`py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'register' 
                ? 'bg-[#CC222F] !text-white shadow-md' 
                : 'text-white/60 light-mode:text-neutral-600 hover:text-white light-mode:hover:text-black'
            }`}
          >
            <UserPlus size={14} className={activeTab === 'register' ? '!text-white' : ''} />
            <span className={activeTab === 'register' ? '!text-white' : ''}>{language === 'ku' ? 'دروستکردنی ئەکاونت' : 'Register'}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
            style={{ color: activeTab === 'login' ? '#ffffff' : undefined }}
            className={`py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'login' 
                ? 'bg-[#CC222F] !text-white shadow-md' 
                : 'text-white/60 light-mode:text-neutral-600 hover:text-white light-mode:hover:text-black'
            }`}
          >
            <LogIn size={14} className={activeTab === 'login' ? '!text-white' : ''} />
            <span className={activeTab === 'login' ? '!text-white' : ''}>{language === 'ku' ? 'چوونە ژوورەوە' : 'Log In'}</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/40 text-xs font-bold text-red-500 flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/70 light-mode:text-neutral-700 mb-1.5">
                {language === 'ku' ? 'کۆدی چالاککردن (کۆدەکە)' : 'Activation Code'}
              </label>
              <input
                type="text"
                placeholder="Taban Play1"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-white/7 light-mode:bg-neutral-100 border border-white/10 light-mode:border-neutral-300 rounded-xl px-4 py-2.5 text-white light-mode:text-black placeholder-white/30 light-mode:placeholder-neutral-400 outline-none focus:border-[#CC222F] text-xs font-semibold"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 light-mode:text-neutral-700 mb-1.5">
                {language === 'ku' ? 'ناوی بەکارهێنەر (یوزەرنەیم)' : 'Username'}
              </label>
              <input
                type="text"
                placeholder={language === 'ku' ? 'یوزەرنەیمێک هەڵبژێرە...' : 'Choose a username...'}
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
                className="w-full bg-white/7 light-mode:bg-neutral-100 border border-white/10 light-mode:border-neutral-300 rounded-xl px-4 py-2.5 text-white light-mode:text-black placeholder-white/30 light-mode:placeholder-neutral-400 outline-none focus:border-[#CC222F] text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 light-mode:text-neutral-700 mb-1.5">
                {language === 'ku' ? 'وشەی نهێنی (پاسۆرد)' : 'Password'}
              </label>
              <input
                type="password"
                placeholder="******"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                className="w-full bg-white/7 light-mode:bg-neutral-100 border border-white/10 light-mode:border-neutral-300 rounded-xl px-4 py-2.5 text-white light-mode:text-black placeholder-white/30 light-mode:placeholder-neutral-400 outline-none focus:border-[#CC222F] text-xs font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#CC222F] hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span>{language === 'ku' ? 'دروستکردنی ئەکاونت' : 'Create Account'}</span>
            </button>
          </form>
        )}

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/70 light-mode:text-neutral-700 mb-1.5">
                {language === 'ku' ? 'ناوی بەکارهێنەر (یوزەرنەیم)' : 'Username'}
              </label>
              <input
                type="text"
                placeholder={language === 'ku' ? 'یوزەرنەیمەکەت بنووسە...' : 'Enter your username...'}
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full bg-white/7 light-mode:bg-neutral-100 border border-white/10 light-mode:border-neutral-300 rounded-xl px-4 py-2.5 text-white light-mode:text-black placeholder-white/30 light-mode:placeholder-neutral-400 outline-none focus:border-[#CC222F] text-xs font-semibold"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 light-mode:text-neutral-700 mb-1.5">
                {language === 'ku' ? 'وشەی نهێنی (پاسۆرد)' : 'Password'}
              </label>
              <input
                type="password"
                placeholder="******"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-white/7 light-mode:bg-neutral-100 border border-white/10 light-mode:border-neutral-300 rounded-xl px-4 py-2.5 text-white light-mode:text-black placeholder-white/30 light-mode:placeholder-neutral-400 outline-none focus:border-[#CC222F] text-xs font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#CC222F] hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
            >
              <LogIn size={16} />
              <span>{language === 'ku' ? 'چوونە ژوورەوە' : 'Log In'}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
