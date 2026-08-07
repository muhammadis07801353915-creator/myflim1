'use client';

import { useState } from 'react';
import { X, Key, User, CheckCircle2, UserPlus, LogIn, AlertCircle } from 'lucide-react';
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
  const [registerName, setRegisterName] = useState('');

  // Login States
  const [loginName, setLoginName] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const normalizedCode = code.trim().toLowerCase();
    if (normalizedCode !== 'taban play1' && normalizedCode !== 'tabanplay1') {
      setErrorMessage(
        language === 'ku' 
          ? 'کۆدەکە هەڵەیە! تکایە کۆدی Taban Play1 بنووسە.' 
          : 'Invalid code! Please enter code Taban Play1.'
      );
      return;
    }

    if (!registerName.trim()) {
      setErrorMessage(
        language === 'ku' 
          ? 'تکایە ناوی بەکارهێنەر بنووسە.' 
          : 'Please enter a username.'
      );
      return;
    }

    await registerUserAccount(registerName.trim());
    onClose();
    if (onSuccess) onSuccess();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginName.trim()) {
      setErrorMessage(
        language === 'ku' 
          ? 'تکایە ناوی بەکارهێنەر بنووسە.' 
          : 'Please enter your username.'
      );
      return;
    }

    await loginUserAccount(loginName.trim());
    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
      <div className="bg-[#181924] light-mode:bg-white border border-white/10 light-mode:border-neutral-200 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-5" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 light-mode:border-neutral-200 pb-3">
          <h3 className="text-lg font-bold text-white light-mode:text-black">
            {language === 'ku' ? 'دروستکردنی ئەکاونت / چوونە ژوورەوە' : 'Account Register / Login'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 light-mode:bg-neutral-200 flex items-center justify-center text-white/60 light-mode:text-neutral-700 hover:text-white light-mode:hover:text-black transition">
            <X size={18} />
          </button>
        </div>

        {/* Top Notice */}
        <div className="p-3.5 rounded-2xl bg-[#CC222F]/15 border border-[#CC222F]/40 text-xs font-bold text-[#CC222F] flex items-start gap-2.5">
          <Key size={18} className="shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {language === 'ku' 
              ? 'تکایە ئەو کۆدە داخل بکە لە بەشی داخڵ کردنی کۆد: Taban Play1' 
              : 'Please enter this code in code entry section: Taban Play1'}
          </p>
        </div>

        {/* Tab Buttons (Register vs Login) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 light-mode:bg-neutral-100 rounded-2xl border border-white/5 light-mode:border-neutral-200">
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setErrorMessage(''); }}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'register' 
                ? 'bg-[#CC222F] text-white shadow-md' 
                : 'text-white/60 light-mode:text-neutral-600 hover:text-white light-mode:hover:text-black'
            }`}
          >
            <UserPlus size={14} />
            <span>{language === 'ku' ? 'ئەکاونتی نوێ بە کۆد' : 'Register with Code'}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'login' 
                ? 'bg-[#CC222F] text-white shadow-md' 
                : 'text-white/60 light-mode:text-neutral-600 hover:text-white light-mode:hover:text-black'
            }`}
          >
            <LogIn size={14} />
            <span>{language === 'ku' ? 'چوونە ژوورەوە' : 'Log In'}</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-500 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/70 light-mode:text-neutral-700 mb-1.5">
                {language === 'ku' ? 'کۆدی چالاککردن' : 'Unlock Code'}
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
                placeholder={language === 'ku' ? 'ناوی خۆت بنووسە...' : 'Enter your name...'}
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                className="w-full bg-white/7 light-mode:bg-neutral-100 border border-white/10 light-mode:border-neutral-300 rounded-xl px-4 py-2.5 text-white light-mode:text-black placeholder-white/30 light-mode:placeholder-neutral-400 outline-none focus:border-[#CC222F] text-xs font-semibold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#CC222F] hover:bg-red-700 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
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
                {language === 'ku' ? 'ناوی بەکارهێنەر (یوزەرنەیمەکەت)' : 'Your Username'}
              </label>
              <input
                type="text"
                placeholder={language === 'ku' ? 'ناوی بەکارهێنەری پێشووت بنووسە...' : 'Enter existing username...'}
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                className="w-full bg-white/7 light-mode:bg-neutral-100 border border-white/10 light-mode:border-neutral-300 rounded-xl px-4 py-2.5 text-white light-mode:text-black placeholder-white/30 light-mode:placeholder-neutral-400 outline-none focus:border-[#CC222F] text-xs font-semibold"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#CC222F] hover:bg-red-700 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
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
