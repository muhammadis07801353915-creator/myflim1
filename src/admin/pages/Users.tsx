'use client';
import { useState, useEffect } from 'react';
import { 
  Search, Shield, User, RefreshCw, Smartphone, Globe, Clock, Users as UsersIcon, 
  Eye, EyeOff, Download, Calendar, Key, CheckCircle, ArrowDownToLine
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface StoredUserAccount {
  id: string;
  username: string;
  password: string;
  avatar?: string;
  platform?: 'App' | 'Web';
  createdAt?: string;
}

interface DailyRecord {
  date: string;
  appUsers: string[];
  webUsers: string[];
}

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
  key: string;
  source: 'web_google' | 'app_code';
  email: string | null;
  display_name: string | null;
  loginCount: number;
  lastLogin: string;
  firstLogin: string;
}

export default function Users() {
  const [activeTab, setActiveTab] = useState<'accounts' | 'daily' | 'logins'>('accounts');
  
  // Accounts state
  const [accounts, setAccounts] = useState<StoredUserAccount[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [accSearch, setAccSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'App' | 'Web'>('all');

  // Daily History state
  const [dailyHistory, setDailyHistory] = useState<DailyRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Logins state
  const [logins, setLogins] = useState<AggregatedUser[]>([]);
  const [loginSearch, setLoginSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'web_google' | 'app_code'>('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchAccounts(), fetchDailyHistory(), fetchLogins()]);
    } catch (e: any) {
      console.error('Fetch all error:', e);
    }
    setLoading(false);
  };

  const fetchAccounts = async () => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'taban_registered_user_accounts')
        .maybeSingle();

      if (data?.value) {
        const parsed: StoredUserAccount[] = JSON.parse(data.value);
        if (Array.isArray(parsed)) {
          setAccounts(parsed.reverse());
        }
      }
    } catch (e) {
      console.warn('fetchAccounts error:', e);
    }
  };

  const fetchDailyHistory = async () => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'taban_daily_active_users_history')
        .maybeSingle();

      if (data?.value) {
        const parsed: Record<string, { appUsers: string[]; webUsers: string[] }> = JSON.parse(data.value);
        const list: DailyRecord[] = Object.keys(parsed).map(date => ({
          date,
          appUsers: Array.isArray(parsed[date].appUsers) ? parsed[date].appUsers : [],
          webUsers: Array.isArray(parsed[date].webUsers) ? parsed[date].webUsers : [],
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setDailyHistory(list);
        if (list.length > 0 && !selectedDate) {
          setSelectedDate(list[0].date);
        }
      }
    } catch (e) {
      console.warn('fetchDailyHistory error:', e);
    }
  };

  const fetchLogins = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('user_logins')
        .select('*')
        .order('created_at', { ascending: false });

      if (!fetchError && data) {
        const records: LoginRecord[] = data;
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
        setLogins(Array.from(map.values()).sort((a, b) => new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime()));
      }
    } catch (e) {
      console.warn('fetchLogins error:', e);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Export Accounts CSV
  const exportAccountsCSV = () => {
    if (accounts.length === 0) return;
    let csv = 'Username,Password,Platform,CreatedAt\n';
    accounts.forEach(a => {
      csv += `"${a.username}","${a.password}","${a.platform || 'App'}","${a.createdAt || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Taban_Play_Accounts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Daily Data CSV
  const exportDayCSV = (record: DailyRecord) => {
    let csv = `Date,Platform,User_Device_ID\n`;
    record.appUsers.forEach(id => {
      csv += `"${record.date}","Mobile App","${id}"\n`;
    });
    record.webUsers.forEach(id => {
      csv += `"${record.date}","Web Site","${id}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Taban_Play_Daily_Users_${record.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'نادیار';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  const filteredAccounts = accounts.filter(a => {
    const matchSearch = !accSearch || a.username.toLowerCase().includes(accSearch.toLowerCase());
    const matchPlatform = platformFilter === 'all' || (a.platform || 'App') === platformFilter;
    return matchSearch && matchPlatform;
  });

  const appAccountsCount = accounts.filter(a => (a.platform || 'App') === 'App').length;
  const webAccountsCount = accounts.filter(a => a.platform === 'Web').length;

  const selectedDayRecord = dailyHistory.find(d => d.date === selectedDate) || dailyHistory[0];

  return (
    <div className="text-white space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <UsersIcon size={26} className="text-red-500" />
            بەڕێوەبردنی بەکارهێنەران و هەژمارەکان (Users Center)
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            بینینی پاسۆرد و یوزەرنەیمی هەژمارەکان و ئاماری بەکارهێنەرانی ڕۆژانەی ئەپ و وێب
          </p>
        </div>
        <button
          onClick={fetchAllData}
          className="flex items-center space-x-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition text-sm font-bold"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin text-red-500' : ''} />
          <span>نوێکردنەوە</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${
            activeTab === 'accounts'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
              : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white'
          }`}
        >
          <Key size={18} />
          <span>هەژمارە تۆمارکراوەکان ({accounts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${
            activeTab === 'daily'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
              : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white'
          }`}
        >
          <Calendar size={18} />
          <span>ئاماری ڕۆژانە (30 ڕۆژی ڕابردوو)</span>
        </button>
        <button
          onClick={() => setActiveTab('logins')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${
            activeTab === 'logins'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
              : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white'
          }`}
        >
          <Clock size={18} />
          <span>مێژووی داخڵبوون ({logins.length})</span>
        </button>
      </div>

      {/* ─── TAB 1: REGISTERED ACCOUNTS ─── */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#1a1d24] border border-red-500/20 rounded-xl p-5">
              <p className="text-red-400 text-xs font-bold uppercase tracking-wider">کۆی هەژمارە تۆمارکراوەکان</p>
              <p className="text-3xl font-black text-white mt-1">{accounts.length.toLocaleString()}</p>
            </div>
            <div className="bg-[#1a1d24] border border-emerald-500/20 rounded-xl p-5">
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">هەژمارەکانی ئەپ (App)</p>
              <p className="text-3xl font-black text-emerald-400 mt-1">{appAccountsCount.toLocaleString()}</p>
            </div>
            <div className="bg-[#1a1d24] border border-blue-500/20 rounded-xl p-5">
              <p className="text-blue-400 text-xs font-bold uppercase tracking-wider">هەژمارەکانی وێب (Web)</p>
              <p className="text-3xl font-black text-blue-400 mt-1">{webAccountsCount.toLocaleString()}</p>
            </div>
          </div>

          {/* Filter & Export Row */}
          <div className="bg-[#1a1d24] border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                <input
                  type="text"
                  placeholder="گەڕان بۆ یوزەرنەیم..."
                  value={accSearch}
                  onChange={e => setAccSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white focus:border-red-500 outline-none"
                />
              </div>
              <select
                value={platformFilter}
                onChange={e => setPlatformFilter(e.target.value as any)}
                className="bg-neutral-900 border border-neutral-800 text-white text-sm rounded-xl px-4 py-2 outline-none"
              >
                <option value="all">سەرجەم ئامێرەکان</option>
                <option value="App">تەنها ئەپ (Mobile App)</option>
                <option value="Web">تەنها وێب (Web Site)</option>
              </select>
            </div>

            <button
              onClick={exportAccountsCSV}
              disabled={accounts.length === 0}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-xs disabled:opacity-40"
            >
              <Download size={16} />
              <span>داگرتنی لیستی هەژمارەکان (CSV)</span>
            </button>
          </div>

          {/* Accounts Table */}
          <div className="bg-[#1a1d24] border border-neutral-800 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="p-12 text-center text-neutral-500 space-y-2">
                <User size={40} className="mx-auto opacity-30" />
                <p className="font-bold">هیچ هەژمارێک نەدۆزرایەوە</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-900/60 text-neutral-400">
                    <tr>
                      <th className="px-6 py-4 font-bold">بەکارهێنەر (Username)</th>
                      <th className="px-6 py-4 font-bold">وشەی نهێنی (Password)</th>
                      <th className="px-6 py-4 font-bold">سەرچاوە (Platform)</th>
                      <th className="px-6 py-4 font-bold">بەرواری دروستکردن</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/80">
                    {filteredAccounts.map(acc => {
                      const showPass = visiblePasswords[acc.id] || false;
                      const isApp = (acc.platform || 'App') === 'App';

                      return (
                        <tr key={acc.id} className="hover:bg-neutral-800/40 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden shrink-0 border border-neutral-700 relative">
                                {acc.avatar ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={acc.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-neutral-500">
                                    <User size={18} />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-white text-base">{acc.username}</p>
                                <p className="text-[11px] text-neutral-500">ID: {acc.id}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800 text-amber-400 font-bold tracking-wider text-sm min-w-[120px] text-center">
                                {showPass ? acc.password : '••••••••'}
                              </span>
                              <button
                                onClick={() => togglePasswordVisibility(acc.id)}
                                className="p-2 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition"
                                title={showPass ? 'شاردنەوەی پاسۆرد' : 'پیشاندانی پاسۆرد'}
                              >
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            {isApp ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <Smartphone size={13} />
                                <span>ئەپ (Mobile App)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                <Globe size={13} />
                                <span>وێب (Web Site)</span>
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-neutral-400 text-xs">
                            {formatDate(acc.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: DAILY ACTIVE USERS ANALYTICS (30 DAYS) ─── */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Selected Date Filter & Download Section */}
          <div className="bg-[#1a1d24] border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Calendar size={20} className="text-red-500" />
                  داتای ڕۆژانەی بەکارهێنەران (30 ڕۆژی ڕابردوو)
                </h3>
                <p className="text-neutral-400 text-xs mt-1">
                  تەماشا کردنی ئاماری بەکارهێنەری دیاریکراوی هەر ڕۆژێک و داگرتنی ڕاپۆرتی ڕۆژانە
                </p>
              </div>

              {selectedDayRecord && (
                <button
                  onClick={() => exportDayCSV(selectedDayRecord)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition text-xs shadow-md shadow-red-600/20"
                >
                  <ArrowDownToLine size={16} />
                  <span>داگرتنی داتای ڕۆژی ({selectedDayRecord.date}) CSV</span>
                </button>
              )}
            </div>

            {/* Date Selector Pills */}
            {dailyHistory.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1">
                {dailyHistory.slice(0, 30).map(rec => {
                  const isSelected = rec.date === selectedDate;
                  const total = rec.appUsers.length + rec.webUsers.length;
                  return (
                    <button
                      key={rec.date}
                      onClick={() => setSelectedDate(rec.date)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 border ${
                        isSelected
                          ? 'bg-red-500/20 border-red-500 text-white'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <span>{rec.date}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] ${isSelected ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-300'}`}>
                        {total}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detailed Selected Day Card */}
          {selectedDayRecord ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#1a1d24] border border-neutral-800 rounded-2xl p-5 text-center">
                <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider">کۆی بەکارهێنەرانی ڕۆژی ({selectedDayRecord.date})</p>
                <p className="text-4xl font-black text-white mt-1">
                  {(selectedDayRecord.appUsers.length + selectedDayRecord.webUsers.length).toLocaleString()}
                </p>
              </div>

              <div className="bg-[#1a1d24] border border-emerald-500/20 rounded-2xl p-5 text-center">
                <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">بەکارهێنەرانی ئەپ (Mobile App)</p>
                <p className="text-4xl font-black text-emerald-400 mt-1">
                  {selectedDayRecord.appUsers.length.toLocaleString()}
                </p>
              </div>

              <div className="bg-[#1a1d24] border border-blue-500/20 rounded-2xl p-5 text-center">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-wider">بەکارهێنەرانی وێب (Web Site)</p>
                <p className="text-4xl font-black text-blue-400 mt-1">
                  {selectedDayRecord.webUsers.length.toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-[#1a1d24] border border-neutral-800 rounded-2xl text-neutral-500">
              داتای ئەم ڕۆژە نەدۆزرایەوە
            </div>
          )}

          {/* 30-Day History Table */}
          <div className="bg-[#1a1d24] border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800">
              <h4 className="font-bold text-white text-base">خشتەی داتای 30 ڕۆژی ڕابردوو (Day-by-Day Breakdown)</h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-900/60 text-neutral-400">
                  <tr>
                    <th className="px-6 py-4 font-bold">بەروار (Date)</th>
                    <th className="px-6 py-4 font-bold text-center">بەکارهێنەرانی ئەپ (App)</th>
                    <th className="px-6 py-4 font-bold text-center">بەکارهێنەرانی وێب (Web)</th>
                    <th className="px-6 py-4 font-bold text-center">کۆی گشتی بەکارهێنەران</th>
                    <th className="px-6 py-4 font-bold text-center">کردارەکان</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80">
                  {dailyHistory.slice(0, 30).map(rec => {
                    const total = rec.appUsers.length + rec.webUsers.length;
                    const isSelected = rec.date === selectedDate;

                    return (
                      <tr
                        key={rec.date}
                        className={`transition ${isSelected ? 'bg-red-500/10' : 'hover:bg-neutral-800/40'}`}
                      >
                        <td className="px-6 py-4 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-red-500" />
                            <span>{rec.date}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {rec.appUsers.length.toLocaleString()}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {rec.webUsers.length.toLocaleString()}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-center font-black text-white text-base">
                          {total.toLocaleString()}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => exportDayCSV(rec)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition text-xs font-bold"
                          >
                            <Download size={13} />
                            <span>داگرتنی CSV</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: LOGIN LOGS ─── */}
      {activeTab === 'logins' && (
        <div className="space-y-6">
          <div className="bg-[#1a1d24] border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 w-full sm:w-80">
                <Search size={18} className="text-neutral-500" />
                <input
                  type="text"
                  placeholder="گەران بە ئیمێل یان ناو..."
                  value={loginSearch}
                  onChange={e => setLoginSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm ml-2 w-full text-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-900/60 text-neutral-400">
                  <tr>
                    <th className="px-6 py-4 font-bold">بەکارهێنەر</th>
                    <th className="px-6 py-4 font-bold">سەرچاوە</th>
                    <th className="px-6 py-4 font-bold text-center">داخڵبوون</th>
                    <th className="px-6 py-4 font-bold">کۆتا داخڵبوون</th>
                    <th className="px-6 py-4 font-bold">یەکەم داخڵبوون</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80">
                  {logins.map(user => (
                    <tr key={user.key} className="hover:bg-neutral-800/40 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                            style={{
                              background: user.source === 'web_google'
                                ? 'rgba(59,130,246,0.1)'
                                : 'rgba(16,185,129,0.1)'
                            }}
                          >
                            {user.source === 'web_google'
                              ? <Globe size={18} className="text-blue-400" />
                              : <Smartphone size={18} className="text-emerald-400" />
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate max-w-[180px]">
                              {user.display_name || (user.source === 'app_code' ? 'ئەپ — بێ ناو' : 'بێ ناو')}
                            </p>
                            <p className="text-xs text-neutral-500 truncate max-w-[180px]">
                              {user.source === 'web_google' ? (user.email || 'بێ ئیمێل') : `Device: ${user.key?.substring(0, 16)}...`}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {user.source === 'web_google' ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 flex items-center w-fit space-x-1">
                            <Globe size={11} />
                            <span>وێب</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 flex items-center w-fit space-x-1">
                            <Smartphone size={11} />
                            <span>ئەپ</span>
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 text-red-400 font-black text-xs">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
