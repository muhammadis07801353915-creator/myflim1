'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/src/lib/supabase';
import { 
  MessageSquare, Send, Search, 
  RefreshCw, CheckCircle2, User
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

export default function AdminSupportMessagesPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();

    // Subscribe to real-time additions on comments table (support_chat)
    const channel = supabase
      .channel('admin_support_chat_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: 'movie_id=eq.support_chat' },
        () => fetchMessages()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages' },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedUserId]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      let allMsgs: SupportMessage[] = [];

      // Source 1: Query comments table with movie_id = 'support_chat' (Guaranteed working Supabase table)
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*')
        .eq('movie_id', 'support_chat')
        .order('created_at', { ascending: true });

      if (commentsData && commentsData.length > 0) {
        commentsData.forEach((c: any) => {
          try {
            const parsed = JSON.parse(c.content);
            if (parsed && parsed.user_id && parsed.message) {
              allMsgs.push({ id: String(c.id), ...parsed });
            }
          } catch (e) {
            // Plain text comment fallback
            if (c.content && c.user_id) {
              allMsgs.push({
                id: String(c.id),
                user_id: c.user_id,
                user_name: 'Bexawer User',
                user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
                message: c.content,
                sender: 'user',
                created_at: c.created_at
              });
            }
          }
        });
      }

      // Source 2: Query support_messages table if exists
      const { data: smData } = await supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (smData && smData.length > 0) {
        smData.forEach((m: any) => {
          if (!allMsgs.some(x => x.message === m.message && x.created_at === m.created_at)) {
            allMsgs.push(m as SupportMessage);
          }
        });
      }

      // Source 3: Query reports table fallback
      const { data: repData } = await supabase
        .from('reports')
        .select('*')
        .eq('movie_id', 'support_chat')
        .order('created_at', { ascending: true });

      if (repData && repData.length > 0) {
        repData.forEach((r: any) => {
          try {
            const parsed = JSON.parse(r.reason);
            if (parsed && parsed.user_id && !allMsgs.some(m => m.message === parsed.message && m.created_at === parsed.created_at)) {
              allMsgs.push({ id: String(r.id), ...parsed });
            }
          } catch (e) {
            // ignore
          }
        });
      }

      // Sort all messages chronologically
      allMsgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      setMessages(allMsgs);

      if (allMsgs.length > 0 && !selectedUserId) {
        const firstUser = allMsgs.find(m => m.sender === 'user')?.user_id || allMsgs[0].user_id;
        setSelectedUserId(firstUser);
      }
    } catch (e) {
      console.error('Error fetching admin messages:', e);
    }
    setLoading(false);
  };

  // Group messages by user_id
  const usersMap: Record<string, { user_id: string; user_name: string; user_avatar: string; lastMessage: string; lastTime: string; unread: boolean }> = {};

  messages.forEach((msg) => {
    if (!usersMap[msg.user_id]) {
      usersMap[msg.user_id] = {
        user_id: msg.user_id,
        user_name: msg.user_name || 'Bexawer User',
        user_avatar: msg.user_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
        lastMessage: msg.message,
        lastTime: msg.created_at,
        unread: msg.sender === 'user',
      };
    } else {
      usersMap[msg.user_id].lastMessage = msg.message;
      usersMap[msg.user_id].lastTime = msg.created_at;
      if (msg.sender === 'user') {
        usersMap[msg.user_id].unread = true;
      }
    }
  });

  const userList = Object.values(usersMap).filter(u => 
    u.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUserMessages = selectedUserId 
    ? messages.filter(m => m.user_id === selectedUserId)
    : [];

  const selectedUserInfo = selectedUserId ? usersMap[selectedUserId] : null;

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedUserId) return;

    const text = replyText.trim();
    setReplyText('');

    const newMsgObj: Omit<SupportMessage, 'id'> = {
      user_id: selectedUserId,
      user_name: 'Admin',
      user_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      message: text,
      sender: 'admin',
      created_at: new Date().toISOString()
    };

    // Optimistic UI update
    setMessages(prev => [...prev, { id: 'temp-' + Date.now(), ...newMsgObj }]);

    try {
      // 1. Insert into comments table with movie_id: 'support_chat'
      await supabase.from('comments').insert([{
        movie_id: 'support_chat',
        user_id: selectedUserId,
        content: JSON.stringify(newMsgObj)
      }]);

      // 2. Insert into support_messages if present
      await supabase.from('support_messages').insert([newMsgObj]);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#1a1d24] border border-neutral-800 rounded-2xl p-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center font-bold">
            <MessageSquare size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">پەیامەکان و چاتی بەکارهێنەران (Live Support Chat)</h1>
            <p className="text-xs text-neutral-400">وڵامدانەوەی ڕاستەوخۆ بۆ پرسیار و داواکارییەکانی بەکارهێنەران</p>
          </div>
        </div>
        <button 
          onClick={fetchMessages}
          className="p-2 bg-[#CC222F] hover:bg-red-700 text-white rounded-xl transition flex items-center gap-2 text-xs font-bold shadow-lg"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>نوێکردنەوە</span>
        </button>
      </div>

      {/* Main Chat Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 bg-[#1a1d24] border border-neutral-800 rounded-2xl overflow-hidden min-h-0">
        
        {/* Left Column: User List (4 cols) */}
        <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-neutral-800 flex flex-col min-h-0">
          <div className="p-3 border-b border-neutral-800 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
              <input
                type="text"
                placeholder="گەڕان بۆ بەکارهێنەر..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/50">
            {userList.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs font-medium">
                {loading ? 'بارکردنی پەیامەکان...' : 'هیچ پەیامێک نەدۆزرایەوە'}
              </div>
            ) : (
              userList.map((u) => {
                const isSelected = u.user_id === selectedUserId;
                return (
                  <button
                    key={u.user_id}
                    onClick={() => setSelectedUserId(u.user_id)}
                    className={`w-full p-3 flex items-center gap-3 text-left transition ${
                      isSelected ? 'bg-red-500/15 border-l-4 border-red-500' : 'hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden relative shrink-0 border border-neutral-700">
                      <img src={u.user_avatar} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-white truncate">{u.user_name}</h4>
                        <span className="text-[10px] text-neutral-500">{formatDate(u.lastTime)}</span>
                      </div>
                      <p className="text-xs text-neutral-400 truncate font-normal">{u.lastMessage}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation (8 cols) */}
        <div className="md:col-span-8 flex flex-col min-h-0 bg-[#0f1115]">
          {selectedUserId && selectedUserInfo ? (
            <>
              {/* Top User Info Bar */}
              <div className="p-3 bg-[#1a1d24] border-b border-neutral-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-neutral-800 overflow-hidden border border-neutral-700">
                    <img src={selectedUserInfo.user_avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{selectedUserInfo.user_name}</h3>
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>سەرخەتە (Online)</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {selectedUserMessages.map((msg, index) => {
                  const isAdmin = msg.sender === 'admin';
                  return (
                    <div
                      key={msg.id || index}
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs font-medium space-y-1 shadow-md ${
                        isAdmin
                          ? 'bg-red-600 text-white rounded-br-none'
                          : 'bg-[#1a1d24] text-neutral-200 border border-neutral-800 rounded-bl-none'
                      }`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                        <p className={`text-[9px] text-right ${isAdmin ? 'text-white/70' : 'text-neutral-500'}`}>
                          {formatDate(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Footer */}
              <form onSubmit={handleSendReply} className="p-3 bg-[#1a1d24] border-t border-neutral-800 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="وەڵامەکەت بنووسە بۆ بەکارهێنەر..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-red-600/20"
                >
                  <Send size={14} />
                  <span>ناردن</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-500">
              <MessageSquare size={48} className="mb-3 text-neutral-700" />
              <p className="text-sm font-bold text-neutral-400">تکایە بەکارهێنەرێک هەڵبژێرە بۆ بینینی چاتەکە</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
