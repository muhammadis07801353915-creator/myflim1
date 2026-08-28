'use client';

import React, { useState } from 'react';
import { Users, X, Send, Mic, MicOff, PhoneOff, CheckCircle2, User, AlertCircle, Copy, Link } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface WatchPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendInvite: (friendUsername: string) => Promise<{ success: boolean; message?: string; shareUrl?: string }>;
  incomingInvite: any;
  onAcceptInvite: (invite: any) => void;
  onDeclineInvite: (inviteId: string) => void;
  activeParty: any;
  isHost: boolean;
  isMicOn: boolean;
  onToggleMic: () => void;
  onLeaveParty: () => void;
  partnerUsername: string;
}

export default function WatchPartyModal({
  isOpen,
  onClose,
  onSendInvite,
  incomingInvite,
  onAcceptInvite,
  onDeclineInvite,
  activeParty,
  isHost,
  isMicOn,
  onToggleMic,
  onLeaveParty,
  partnerUsername,
}: WatchPartyModalProps) {
  const { language } = useLanguage();
  const [friendUsername, setFriendUsername] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [createdShareUrl, setCreatedShareUrl] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendUsername.trim()) return;

    setSending(true);
    setErrorMsg('');
    setSuccessMsg('');
    setCreatedShareUrl('');

    const res = await onSendInvite(friendUsername.trim());
    setSending(false);

    if (res.success) {
      setSuccessMsg(language === 'ku' ? 'داوەتنامەکە بە سەرکەوتوویی نێردرا!' : 'Invite sent successfully!');
      if (res.shareUrl) setCreatedShareUrl(res.shareUrl);
      setFriendUsername('');
    } else {
      setErrorMsg(res.message || 'هەڵەیەک ڕوویدا');
    }
  };

  const copyLink = () => {
    if (createdShareUrl) {
      navigator.clipboard.writeText(createdShareUrl);
      alert(language === 'ku' ? 'لینکی ژووری داوەت کۆپی کرا!' : 'Watch link copied!');
    }
  };

  // 1. Incoming Invite Notification Modal
  if (incomingInvite && !activeParty) {
    return (
      <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-[#14151c] border border-red-500/40 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-[#CC222F]/20 text-[#CC222F] flex items-center justify-center mx-auto ring-4 ring-[#CC222F]/30 animate-pulse">
            <Users size={32} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white mb-1">
              {language === 'ku' ? 'داوەتنامەی سەیری فیلم پێکەوە! 🎬' : 'Watch Together Invite! 🎬'}
            </h3>
            <p className="text-xs text-white/70 leading-relaxed">
              <span className="font-bold text-red-400">{incomingInvite.host_username}</span> {language === 'ku' ? 'داوەتی کردووی بۆ سەیرکردنی فیلمی' : 'invited you to watch'}{' '}
              <span className="font-bold text-white">{incomingInvite.movie_title}</span> {language === 'ku' ? 'پێکەوە' : 'together'}!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => onDeclineInvite(incomingInvite.id)}
              className="py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 text-xs font-bold transition"
            >
              {language === 'ku' ? 'ڕەتکردنەوە' : 'Decline'}
            </button>
            <button
              onClick={() => onAcceptInvite(incomingInvite)}
              className="py-2.5 rounded-xl bg-[#CC222F] hover:bg-red-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30"
            >
              <CheckCircle2 size={16} />
              <span>{language === 'ku' ? 'قبوڵکردن' : 'Accept'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Party Control Panel Overlay
  if (activeParty) {
    return (
      <div className="fixed bottom-6 right-6 z-[450] bg-[#14151c]/95 border border-red-500/40 backdrop-blur-xl text-white rounded-2xl p-4 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-300">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#CC222F]/20 border border-[#CC222F]/40 flex items-center justify-center text-red-400 font-bold text-sm">
              {partnerUsername.slice(0, 2).toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-[#14151c]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold">{partnerUsername}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-500/20 text-red-400">
                {isHost ? (language === 'ku' ? 'سەرپەرشتیار 👑' : 'Host 👑') : (language === 'ku' ? 'بەشداربوو 🎬' : 'Guest 🎬')}
              </span>
            </div>
            <p className="text-[10px] text-white/50">
              {isHost ? (language === 'ku' ? 'کۆنترۆڵی کات لەدەستی تۆدایە' : 'Master Sync Control') : (language === 'ku' ? 'کۆنترۆڵ لای سەرپەرشتیارە' : 'Synced to Host')}
            </p>
          </div>
        </div>

        {/* Mic Toggle Button */}
        <button
          onClick={onToggleMic}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
            isMicOn ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
          title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
        </button>

        {/* Leave Party Button */}
        <button
          onClick={onLeaveParty}
          className="w-10 h-10 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 flex items-center justify-center transition border border-red-500/30"
          title="Leave Watch Party"
        >
          <PhoneOff size={18} />
        </button>
      </div>
    );
  }

  if (!isOpen) return null;

  // 3. Send Invite Modal
  return (
    <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#14151c] border border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#CC222F]/20 text-[#CC222F] flex items-center justify-center">
              <Users size={18} />
            </div>
            <h3 className="text-base font-bold text-white">
              {language === 'ku' ? 'سەیری فیلم پێکەوە 👥' : 'Watch Together 👥'}
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-white/70 mb-1.5">
              {language === 'ku' ? 'ناوی بەکارهێنەری هاوڕێکەت (Username)' : 'Friend\'s Username'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={friendUsername}
                onChange={e => setFriendUsername(e.target.value)}
                placeholder={language === 'ku' ? 'یوزەرنەیمەکەی بنووسە (نموونە: Hamais400)' : 'Type username (e.g. Hamais400)'}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#CC222F]"
                autoFocus
              />
              <User size={16} className="absolute right-3 top-3 text-white/30" />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-xs font-bold text-red-400 flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs font-bold text-emerald-400 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
              {createdShareUrl && (
                <button
                  type="button"
                  onClick={copyLink}
                  className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Copy size={13} />
                  <span>{language === 'ku' ? 'کۆپی کردنی لینکی داوەتنامە' : 'Copy Direct Watch Link'}</span>
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={sending || !friendUsername.trim()}
            className="w-full py-3 bg-[#CC222F] hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
          >
            <Send size={15} />
            <span>{language === 'ku' ? 'ناردنی داوەتنامە' : 'Send Invite'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
