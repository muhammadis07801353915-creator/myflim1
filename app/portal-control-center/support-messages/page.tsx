'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/src/lib/supabase';
import {
  MessageSquare, Send, Search,
  RefreshCw, ArrowLeft, Users, Circle,
  Settings, Check, X, Image as ImageIcon
} from 'lucide-react';

interface SupportMessage {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  message: string;
  sender: 'user' | 'admin';
  created_at: string;
}

interface UserConvo {
  user_id: string;
  user_name: string;
  user_avatar: string;
  lastMessage: string;
  lastTime: string;
  lastSender: 'user' | 'admin';
  unreadCount: number;
  messages: SupportMessage[];
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop',
];

function getAvatar(avatar: string, name: string) {
  if (avatar && avatar.startsWith('http')) return avatar;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=CC222F&color=fff&size=128`;
}

export default function AdminSupportMessagesPage() {
  const [allMessages, setAllMessages] = useState<SupportMessage[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const selectedUserIdRef = useRef<string | null>(null);
  const initialSelectionDoneRef = useRef(false);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Admin Custom Avatar State
  const [adminAvatar, setAdminAvatar] = useState<string>(DEFAULT_AVATARS[2]);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [tempAvatarUrl, setTempAvatarUrl] = useState('');

  const handleSelectUser = (id: string | null) => {
    selectedUserIdRef.current = id;
    setSelectedUserId(id);
  };

  // Load saved Admin Avatar URL on mount
  useEffect(() => {
    const fetchAdminAvatar = async () => {
      try {
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'taban_admin_avatar')
          .maybeSingle();

        if (data?.value) {
          setAdminAvatar(data.value);
          setTempAvatarUrl(data.value);
        } else {
          const local = localStorage.getItem('taban_admin_avatar');
          if (local) {
            setAdminAvatar(local);
            setTempAvatarUrl(local);
          }
        }
      } catch (e) {
        console.warn('Fetch admin avatar error:', e);
      }
    };

    fetchAdminAvatar();
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => fetchMessages(false), 2500);
    const channel = supabase
      .channel('admin_support_chat_v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'key=eq.taban_live_support_chats' }, () => fetchMessages(false))
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages, selectedUserId]);

  const saveAdminAvatar = async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setAdminAvatar(trimmed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('taban_admin_avatar', trimmed);
    }
    setShowAvatarModal(false);

    try {
      const { error } = await supabase
        .from('settings')
        .update({ value: trimmed })
        .eq('key', 'taban_admin_avatar');

      if (error) {
        await supabase.from('settings').insert([{ key: 'taban_admin_avatar', value: trimmed }]);
      }
    } catch (e) {
      console.error('Save admin avatar error:', e);
    }
  };

  const fetchMessages = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data } = await supabase.from('settings').select('value').eq('key', 'taban_live_support_chats').maybeSingle();
      if (data?.value) {
        const parsed: SupportMessage[] = JSON.parse(data.value);
        if (Array.isArray(parsed)) {
          parsed.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          setAllMessages(parsed);

          // ONLY auto-select first user ONCE on initial page load (desktop only)
          if (!initialSelectionDoneRef.current && parsed.length > 0) {
            initialSelectionDoneRef.current = true;
            if (typeof window !== 'undefined' && window.innerWidth >= 768) {
              const firstUser = parsed.find(m => m.sender === 'user')?.user_name || parsed[0].user_name;
              handleSelectUser(firstUser);
            }
          }
        }
      }
    } catch (e) { console.warn(e); }
    if (showLoading) setLoading(false);
  };

  // Build user conversation groups
  const usersMap: Record<string, UserConvo> = {};
  allMessages.forEach((msg) => {
    const key = msg.user_name || msg.user_id;
    if (!usersMap[key]) {
      usersMap[key] = {
        user_id: key,
        user_name: msg.user_name || key,
        user_avatar: msg.user_avatar || '',
        lastMessage: msg.message,
        lastTime: msg.created_at,
        lastSender: msg.sender,
        unreadCount: 0,
        messages: [],
      };
    }
    usersMap[key].lastMessage = msg.message;
    usersMap[key].lastTime = msg.created_at;
    usersMap[key].lastSender = msg.sender;
    usersMap[key].messages.push(msg);
    if (msg.sender === 'user') usersMap[key].unreadCount++;
  });

  // Count only unread (user messages after last admin reply)
  Object.values(usersMap).forEach(u => {
    const msgs = u.messages;
    const lastAdminIdx = msgs.map(m => m.sender).lastIndexOf('admin');
    u.unreadCount = lastAdminIdx === -1 ? msgs.filter(m => m.sender === 'user').length
      : msgs.slice(lastAdminIdx + 1).filter(m => m.sender === 'user').length;
  });

  const userList = Object.values(usersMap)
    .sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime())
    .filter(u =>
      u.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const selectedUser = selectedUserId ? usersMap[selectedUserId] : null;
  const selectedMessages = selectedUser?.messages || [];

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedUserId) return;
    setSending(true);
    const text = replyText.trim();
    setReplyText('');

    const newMsg: SupportMessage = {
      id: 'admin_' + Date.now(),
      user_id: selectedUserId,
      user_name: 'Admin',
      user_avatar: adminAvatar || DEFAULT_AVATARS[2],
      message: text,
      sender: 'admin',
      created_at: new Date().toISOString(),
    };

    const updated = [...allMessages, newMsg];
    setAllMessages(updated);

    try {
      const jsonVal = JSON.stringify(updated);
      const { error } = await supabase.from('settings').update({ value: jsonVal }).eq('key', 'taban_live_support_chats');
      if (error) await supabase.from('settings').insert([{ key: 'taban_live_support_chats', value: jsonVal }]);
    } catch (err) { console.error(err); }
    setSending(false);
  };

  const fmtTime = (d: string) => {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 86400) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const totalUnread = userList.reduce((s, u) => s + u.unreadCount, 0);

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-4">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between bg-[#1a1d24] border border-neutral-800 rounded-2xl p-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center">
            <MessageSquare size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              پەیامەکان و چاتی بەکارهێنەران
              {totalUnread > 0 && (
                <span className="px-2 py-0.5 bg-red-600 rounded-full text-xs font-black text-white animate-pulse">
                  {totalUnread}
                </span>
              )}
            </h1>
            <p className="text-xs text-neutral-400">{userList.length} بەکارهێنەر · وڵامدانەوەی ڕاستەوخۆ</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Admin Custom Avatar Trigger Button */}
          <button
            onClick={() => setShowAvatarModal(true)}
            className="flex items-center gap-2.5 px-3.5 py-2 bg-[#0f1115] border border-neutral-800 hover:border-red-500/50 rounded-xl transition text-xs font-bold text-neutral-200"
            title="دابینکردن یان گۆڕینی وێنەی پرۆفایلی ئادمن"
          >
            <div className="relative w-7 h-7 rounded-full overflow-hidden border border-red-500/60 shrink-0">
              <img
                src={adminAvatar}
                alt="Admin Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_AVATARS[2];
                }}
              />
            </div>
            <span className="hidden sm:inline">وێنەی ئادمن</span>
            <Settings size={14} className="text-neutral-400" />
          </button>

          <button
            onClick={() => fetchMessages(true)}
            className="p-2.5 bg-[#CC222F] hover:bg-red-700 text-white rounded-xl transition flex items-center gap-2 text-xs font-bold"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">نوێکردنەوە</span>
          </button>
        </div>
      </div>

      {/* ── MAIN PANEL ── */}
      <div className="flex-1 flex bg-[#1a1d24] border border-neutral-800 rounded-2xl overflow-hidden min-h-0">

        {/* LEFT: User profiles list */}
        <div
          className={`${selectedUserId ? 'hidden md:flex' : 'flex'} md:w-80 w-full flex-col border-r border-neutral-800 shrink-0`}
        >
          {/* Search */}
          <div className="p-3 border-b border-neutral-800 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={15} />
              <input
                type="text"
                placeholder="گەڕان بۆ بەکارهێنەر..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0f1115] border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Users as profile cards */}
          <div className="flex-1 overflow-y-auto">
            {loading && userList.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs">بارکردنی پەیامەکان...</div>
            ) : userList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-neutral-600">
                <Users size={40} />
                <p className="text-sm font-semibold">هیچ پەیامێک نەدۆزرایەوە</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {userList.map((u) => {
                  const isSelected = u.user_id === selectedUserId;
                  return (
                    <button
                      key={u.user_id}
                      onClick={() => handleSelectUser(u.user_id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-red-600/20 ring-1 ring-red-500/50'
                          : 'hover:bg-neutral-800/60'
                      }`}
                    >
                      {/* Avatar with unread indicator */}
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-neutral-700">
                          <img
                            src={getAvatar(u.user_avatar, u.user_name)}
                            alt={u.user_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.user_name)}&background=CC222F&color=fff&size=128`;
                            }}
                          />
                        </div>
                        {/* Online / unread dot */}
                        {u.unreadCount > 0 ? (
                          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-[9px] font-black text-white border border-[#1a1d24]">
                            {u.unreadCount > 9 ? '9+' : u.unreadCount}
                          </span>
                        ) : (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#1a1d24]" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-sm font-bold truncate ${u.unreadCount > 0 ? 'text-white' : 'text-neutral-300'}`}>
                            {u.user_name}
                          </span>
                          <span className="text-[10px] text-neutral-500 shrink-0 ml-2">{fmtTime(u.lastTime)}</span>
                        </div>
                        <p className={`text-xs truncate ${u.unreadCount > 0 ? 'text-neutral-200 font-semibold' : 'text-neutral-500'}`}>
                          {u.lastSender === 'admin' && <span className="text-red-400">ئادمین: </span>}
                          {u.lastMessage}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Chat area */}
        <div className={`${selectedUserId ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-h-0 bg-[#0f1115]`}>
          {selectedUser ? (
            <>
              {/* Chat top bar */}
              <div className="p-3 bg-[#1a1d24] border-b border-neutral-800 flex items-center gap-3 shrink-0">
                {/* Back button on mobile */}
                <button
                  onClick={() => handleSelectUser(null)}
                  className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                >
                  <ArrowLeft size={18} />
                </button>
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-neutral-700">
                    <img
                      src={getAvatar(selectedUser.user_avatar, selectedUser.user_name)}
                      alt={selectedUser.user_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.user_name)}&background=CC222F&color=fff&size=128`;
                      }}
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#1a1d24]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white">{selectedUser.user_name}</h3>
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <Circle size={7} className="fill-emerald-500 text-emerald-500" />
                    سەرخەتە (Online)
                  </p>
                </div>
                <div className="text-xs text-neutral-500 font-semibold">
                  {selectedMessages.length} پەیام
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {selectedMessages.map((msg, idx) => {
                  const isAdmin = msg.sender === 'admin';
                  const avatarSrc = isAdmin
                    ? (msg.user_avatar || adminAvatar || DEFAULT_AVATARS[2])
                    : getAvatar(msg.user_avatar, msg.user_name);

                  return (
                    <div key={msg.id || idx} className={`flex items-end gap-2 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className="w-7 h-7 rounded-full overflow-hidden border border-neutral-700 shrink-0 mb-1">
                        <img
                          src={avatarSrc}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.user_name)}&background=CC222F&color=fff&size=64`;
                          }}
                        />
                      </div>
                      {/* Bubble */}
                      <div className={`max-w-[72%] space-y-1 ${isAdmin ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`rounded-2xl px-3.5 py-2.5 text-xs shadow-md ${
                          isAdmin
                            ? 'bg-gradient-to-br from-red-600 to-red-700 text-white rounded-br-none'
                            : 'bg-[#1e2130] text-neutral-100 border border-neutral-700/50 rounded-bl-none'
                        }`}>
                          <p className="whitespace-pre-wrap leading-relaxed font-medium">{msg.message}</p>
                        </div>
                        <span className="text-[9px] text-neutral-600 px-1">{fmtTime(msg.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Reply input */}
              <form
                onSubmit={handleSendReply}
                className="p-3 bg-[#1a1d24] border-t border-neutral-800 flex items-center gap-2 shrink-0"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-neutral-700 shrink-0">
                  <img
                    src={adminAvatar || DEFAULT_AVATARS[2]}
                    alt="Admin Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_AVATARS[2];
                    }}
                  />
                </div>
                <input
                  type="text"
                  placeholder={`وەڵامەکەت بنووسە بۆ ${selectedUser.user_name}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-[#0f1115] border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-red-500 transition"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sending}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-red-600/20"
                >
                  <Send size={13} />
                  <span>ناردن</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-neutral-600">
              <div className="w-20 h-20 rounded-full bg-neutral-800/50 flex items-center justify-center">
                <MessageSquare size={36} />
              </div>
              <div className="text-center">
                <p className="font-bold text-neutral-400 text-sm">پرۆفایلێک هەڵبژێرە</p>
                <p className="text-xs text-neutral-600 mt-1">کلیک بکە سەر ناوی بەکارهێنەرێک لە لایەوە</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ADMIN AVATAR EDIT MODAL ── */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1a1d24] border border-neutral-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon size={18} className="text-red-500" />
                <h2 className="text-sm font-bold text-white">گۆڕینی وێنەی پرۆفایلی ئادمن</h2>
              </div>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-neutral-400">
                لینکی دەرەکی (Image URL) بۆ وێنەی پرۆفایلی ئادمن بنووسە. ئەم وێنەیە لە هەموو وەڵامەکانت لە وێب و ئەپ پیشانی بەکارهێنەران دەدرێت:
              </p>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-300">بەستەری وێنە (URL):</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={tempAvatarUrl}
                  onChange={(e) => setTempAvatarUrl(e.target.value)}
                  className="w-full bg-[#0f1115] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-red-500 dir-ltr"
                />
              </div>

              {/* Live Preview */}
              {tempAvatarUrl.trim() && (
                <div className="flex items-center gap-3 p-3 bg-[#0f1115] rounded-xl border border-neutral-800">
                  <img
                    src={tempAvatarUrl.trim()}
                    alt="Preview"
                    className="w-12 h-12 rounded-full object-cover border-2 border-red-500 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_AVATARS[2];
                    }}
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">پیشاندانی ڕاستەوخۆ (Live Preview)</span>
                    <span className="text-[10px] text-emerald-400">وێنەکە ئامادەیە بۆ ڕاگرتن</span>
                  </div>
                </div>
              )}

              {/* Preset Avatars */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-neutral-400 block">یان هەڵبژاردن لە نموونەکان:</span>
                <div className="flex items-center gap-3 pt-1">
                  {DEFAULT_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTempAvatarUrl(url)}
                      className={`w-10 h-10 rounded-full overflow-hidden border-2 transition ${
                        tempAvatarUrl === url ? 'border-red-500 scale-105' : 'border-neutral-700 hover:border-neutral-500'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setShowAvatarModal(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold transition"
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={() => saveAdminAvatar(tempAvatarUrl)}
                disabled={!tempAvatarUrl.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>سەیڤکردن</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
