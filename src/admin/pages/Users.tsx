'use client';
import { useState, useEffect } from 'react';
import { Search, Shield, User, RefreshCw, Smartphone, Globe, Clock, Users as UsersIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LoginRecord {
  id: string;
  created_at: string;
  source: 'web_google' | 'app_code';
  email: string | null;
  display_name: string | null;
  user_id: string | null;
  device_id: string | null;
  code_used: string | null;
}

interface AggregatedUser {
  key: string;             // email or device_id
  source: 'web_google' | 'app_code';
  email: string | null;
  display_name: string | null;
  loginCount: number;
  lastLogin: string;
  firstLogin: string;
}

export default function Users() {
  const [logins, setLogins] = useState<AggregatedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'web_google' | 'app_code'>('all');
  const [stats, setStats] = useState({ total: 0, web: 0, app: 0, uniqueUsers: 0 });
  const [tableExists, setTableExists] = useState(true);

  const fetchLogins = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('user_logins')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        if (fetchError.message.includes('does not exist') || fetchError.message.includes('schema cache')) {
          setTableExists(false);
          setError('TABLE_NOT_EXIST');
        } else {
          setError(fetchError.message);
        }
        setLoading(false);
        return;
      }

      const records: LoginRecord[] = data || [];

      // Aggregate by email (for web) or device_id (for app)
      const map = new Map<string, AggregatedUser>();
      for (const rec of records) {
        const key = rec.source === 'web_google' ? (rec.email || rec.user_id || 'unknown') : (rec.device_id || 'unknown');
        if (map.has(key)) {
          const existing = map.get(key)!;
          existing.loginCount++;
          if (rec.created_at < existing.firstLogin) existing.firstLogin = rec.created_at;
          if (rec.created_at > existing.lastLogin) existing.lastLogin = rec.created_at;
        } else {
          map.set(key, {
            key,
            source: rec.source,
            email: rec.email,
            display_name: rec.display_name,
            loginCount: 1,
            lastLogin: rec.created_at,
            firstLogin: rec.created_at,
          });
        }
      }

      const aggregated = Array.from(map.values()).sort((a, b) =>
        new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime()
      );

      setLogins(aggregated);
      setStats({
        total: records.length,
        web: records.filter(r => r.source === 'web_google').length,
        app: records.filter(r => r.source === 'app_code').length,
        uniqueUsers: aggregated.length,
      });
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogins();
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const filtered = logins.filter(u => {
    const matchSearch = !search ||
      (u.email?.toLowerCase().includes(search.toLowerCase())) ||
      (u.display_name?.toLowerCase().includes(search.toLowerCase())) ||
      (u.key?.toLowerCase().includes(search.toLowerCase()));
    const matchSource = sourceFilter === 'all' || u.source === sourceFilter;
    return matchSearch && matchSource;
  });

  if (!tableExists) {
    return (
      <div className="text-white space-y-6">
        <h1 className="text-2xl font-bold">Users Management</h1>
        <div className="bg-[#1a1d24] border border-yellow-500/30 rounded-xl p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto">
            <Shield size={32} className="text-yellow-500" />
          </div>
          <h2 className="text-xl font-bold text-yellow-400">پێویستە تەیبڵ دروست بکرێت</h2>
          <p className="text-neutral-400 text-sm max-w-lg mx-auto">
            تەیبڵی <code className="bg-neutral-900 px-2 py-0.5 rounded text-yellow-400">user_logins</code> هێشتا لە Supabase دروست نەکراوە.
          </p>
          <div className="bg-neutral-900 rounded-xl p-4 text-left text-xs font-mono text-emerald-400 overflow-x-auto">
            <pre>{`CREATE TABLE IF NOT EXISTS public.user_logins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'web_google',
  email TEXT,
  display_name TEXT,
  user_id TEXT,
  device_id TEXT,
  code_used TEXT
);
ALTER TABLE public.user_logins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert for all" ON public.user_logins FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read for all" ON public.user_logins FOR SELECT USING (true);`}</pre>
          </div>
          <p className="text-neutral-500 text-sm">
            بچۆ <strong className="text-white">Supabase Dashboard → SQL Editor</strong> و ئەم SQL بکوپی بکەرەوە و بیکارخەرێوە
          </p>
          <button
            onClick={fetchLogins}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition flex items-center space-x-2 mx-auto"
          >
            <RefreshCw size={16} />
            <span>تاقی کردنەوەی دووبارە</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Users Management</h1>
          <p className="text-neutral-400 text-sm mt-1">داخڵبووانی ڕاستەقینە لە وێب و ئەپ</p>
        </div>
        <button
          onClick={fetchLogins}
          className="flex items-center space-x-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition text-sm font-medium"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>نوێکردنەوە</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#1a1d24] border border-neutral-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-white">{stats.uniqueUsers.toLocaleString()}</div>
          <div className="text-xs text-neutral-400 mt-1 flex items-center justify-center space-x-1">
            <UsersIcon size={12} />
            <span>بەکارهێنەری جیاواز</span>
          </div>
        </div>
        <div className="bg-[#1a1d24] border border-neutral-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-white">{stats.total.toLocaleString()}</div>
          <div className="text-xs text-neutral-400 mt-1 flex items-center justify-center space-x-1">
            <Clock size={12} />
            <span>کۆی داخڵبوون</span>
          </div>
        </div>
        <div className="bg-[#1a1d24] border border-blue-500/20 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-blue-400">{stats.web.toLocaleString()}</div>
          <div className="text-xs text-neutral-400 mt-1 flex items-center justify-center space-x-1">
            <Globe size={12} />
            <span>وێب (Google)</span>
          </div>
        </div>
        <div className="bg-[#1a1d24] border border-emerald-500/20 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-emerald-400">{stats.app.toLocaleString()}</div>
          <div className="text-xs text-neutral-400 mt-1 flex items-center justify-center space-x-1">
            <Smartphone size={12} />
            <span>ئەپ (کۆد)</span>
          </div>
        </div>
      </div>

      <div className="bg-[#1a1d24] border border-neutral-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 w-full sm:w-80">
            <Search size={18} className="text-neutral-500" />
            <input
              type="text"
              placeholder="گەران بە ئیمێل یان ناو..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm ml-2 w-full text-white"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value as any)}
              className="bg-neutral-900 border border-neutral-800 text-white text-sm rounded-lg px-3 py-2 outline-none"
            >
              <option value="all">هەموو سەرچاوەکان</option>
              <option value="web_google">وێب — Google</option>
              <option value="app_code">ئەپ — کۆد</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
              <p className="text-neutral-500 text-sm">داتا دێتەوە...</p>
            </div>
          ) : error && error !== 'TABLE_NOT_EXIST' ? (
            <div className="p-8 text-center text-red-400 text-sm">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 space-y-2">
              <UsersIcon size={40} className="mx-auto opacity-30" />
              <p className="font-medium">هیچ بەکارهێنەرێک نەدۆزرایەوە</p>
              <p className="text-xs">کاتێک یەکێک لە وێب بە Google یان لە ئەپ بە کۆد داخل بێت، لێرە دیار دەبێت</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-900/50 text-neutral-400">
                <tr>
                  <th className="px-6 py-4 font-medium">بەکارهێنەر</th>
                  <th className="px-6 py-4 font-medium">سەرچاوە</th>
                  <th className="px-6 py-4 font-medium text-center">داخڵبوون</th>
                  <th className="px-6 py-4 font-medium">کۆتا داخڵبوون</th>
                  <th className="px-6 py-4 font-medium">یەکەم داخڵبوون</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filtered.map((user) => (
                  <tr key={user.key} className="hover:bg-neutral-800/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            background: user.source === 'web_google'
                              ? 'rgba(59,130,246,0.1)'
                              : 'rgba(16,185,129,0.1)'
                          }}>
                          {user.source === 'web_google'
                            ? <Globe size={18} className="text-blue-400" />
                            : <Smartphone size={18} className="text-emerald-400" />
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate max-w-[180px]">
                            {user.display_name ||
                              (user.source === 'app_code' ? 'ئەپ — بێ ناو' : 'بێ ناو')}
                          </p>
                          <p className="text-xs text-neutral-500 truncate max-w-[180px]">
                            {user.source === 'web_google'
                              ? (user.email || 'بێ ئیمێل')
                              : `Device: ${user.key?.substring(0, 16)}...`
                            }
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.source === 'web_google' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 flex items-center w-fit space-x-1">
                          <Globe size={11} />
                          <span>وێب</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 flex items-center w-fit space-x-1">
                          <Smartphone size={11} />
                          <span>ئەپ</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-red-500/10 text-red-400 font-black text-sm">
                        {user.loginCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-400 text-xs whitespace-nowrap">
                      {formatDate(user.lastLogin)}
                    </td>
                    <td className="px-6 py-4 text-neutral-500 text-xs whitespace-nowrap">
                      {formatDate(user.firstLogin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="p-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
            <span>کۆی نیشاندراو: <strong className="text-white">{filtered.length}</strong> بەکارهێنەر</span>
            <span>داتا لە Supabase دێتەوە — ڕاستەقینەیە</span>
          </div>
        )}
      </div>
    </div>
  );
}
