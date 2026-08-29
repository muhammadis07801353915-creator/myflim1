'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart, Calendar, Eye, Users, Smartphone, Globe, Download, ArrowDownToLine } from 'lucide-react';

interface DailyRecord {
  date: string;
  appUsers: string[];
  webUsers: string[];
}

export default function AnalyticsAdmin() {
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    month: 0,
    year: 0,
    total: 0
  });
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [dailyHistory, setDailyHistory] = useState<DailyRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchDailyHistory();

    const channel = supabase.channel('online-users');
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineUsers(Object.keys(state).length);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

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

  const fetchStats = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const IRAQ_OFFSET_MS = 3 * 60 * 60 * 1000;
      const nowInIraq = new Date(now.getTime() + IRAQ_OFFSET_MS);
      const todayInIraqMidnight = new Date(Date.UTC(nowInIraq.getUTCFullYear(), nowInIraq.getUTCMonth(), nowInIraq.getUTCDate()) - IRAQ_OFFSET_MS);
      const todayStart = todayInIraqMidnight.toISOString();
      
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const yearStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();

      const [todayRes, weekRes, monthRes, yearRes, totalRes] = await Promise.all([
        supabase.from('site_visits').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
        supabase.from('site_visits').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
        supabase.from('site_visits').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
        supabase.from('site_visits').select('*', { count: 'exact', head: true }).gte('created_at', yearStart),
        supabase.from('site_visits').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        today: todayRes.count || 0,
        week: weekRes.count || 0,
        month: monthRes.count || 0,
        year: yearRes.count || 0,
        total: totalRes.count || 0
      });
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
    setLoading(false);
  };

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
    link.setAttribute('download', `Taban_Play_Daily_Analytics_${record.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedDayRecord = dailyHistory.find(d => d.date === selectedDate) || dailyHistory[0];

  return (
    <div className="text-white space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <BarChart size={26} className="text-red-500" />
            ئاماری بەکارهێنەرانی ڕاستەقینە (Analytics Center)
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            داتای بەکارهێنەرانی ڕۆژانەی ئەپ و وێب لەگەڵ مێژووی 30 ڕۆژی ڕابردوو
          </p>
        </div>
      </div>

      {/* Realtime & Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-red-600/20 to-red-900/10 border border-red-500/30 p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-[10px] text-red-400 font-bold uppercase tracking-tighter">Live</span>
          </div>
          <Users className="w-8 h-8 text-red-500 mb-2" />
          <span className="text-neutral-400 text-xs font-bold uppercase tracking-wider">ئێستا لەسەر وێب (Online Now)</span>
          <span className="text-4xl font-black text-white mt-1">{onlineUsers.toLocaleString()}</span>
        </div>

        <div className="bg-[#1a1d24] border border-neutral-800 p-6 rounded-2xl flex flex-col items-center justify-center">
          <Calendar className="w-8 h-8 text-blue-400 mb-2" />
          <span className="text-neutral-400 text-xs font-bold uppercase tracking-wider">سەردانی ئەمڕۆ (Today Visits)</span>
          <span className="text-4xl font-black text-blue-400 mt-1">{stats.today.toLocaleString()}</span>
        </div>

        <div className="bg-[#1a1d24] border border-neutral-800 p-6 rounded-2xl flex flex-col items-center justify-center">
          <Eye className="w-8 h-8 text-emerald-400 mb-2" />
          <span className="text-neutral-400 text-xs font-bold uppercase tracking-wider">کۆی سەرجەم سەردانەکان</span>
          <span className="text-4xl font-black text-emerald-400 mt-1">{stats.total.toLocaleString()}</span>
        </div>
      </div>

      {/* 30-Day Daily Breakdown Table */}
      <div className="bg-[#1a1d24] border border-neutral-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Calendar size={20} className="text-red-500" />
              داتای ڕۆژانەی ئەپ و وێب بەجیا (30 ڕۆژ)
            </h3>
            <p className="text-neutral-400 text-xs mt-1">
              کلیک لەسەر هەر بەروارێک بکە بۆ داگرتنی ڕاپۆرتی ڕۆژانەی ئەپ و وێب بە فایلی CSV
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

        {/* Daily History Table */}
        <div className="overflow-x-auto rounded-xl border border-neutral-800 mt-4">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900/80 text-neutral-400">
              <tr>
                <th className="px-6 py-4 font-bold">بەروار (Date)</th>
                <th className="px-6 py-4 font-bold text-center">بەکارهێنەرانی ئەپ (Mobile App)</th>
                <th className="px-6 py-4 font-bold text-center">بەکارهێنەرانی وێب (Web Site)</th>
                <th className="px-6 py-4 font-bold text-center">کۆی بەکارهێنەرانی ڕۆژانە</th>
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
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Smartphone size={13} />
                        <span>{rec.appUsers.length.toLocaleString()}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Globe size={13} />
                        <span>{rec.webUsers.length.toLocaleString()}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center font-black text-white text-base">
                      {total.toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => exportDayCSV(rec)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition text-xs font-bold"
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
  );
}
