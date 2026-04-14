'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart, Calendar, Eye, Users } from 'lucide-react';

export default function AnalyticsAdmin() {
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    month: 0,
    year: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // For simplicity in client-side, we fetch recent and aggregate.
      // In a real big app, this should be done via an RPC function in Supabase.
      const now = new Date();
      
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

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

  return (
    <div className="text-white flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
      <div className="bg-[#1a1d24] border border-neutral-800 p-8 rounded-2xl max-w-lg w-full">
        <h2 className="text-2xl font-bold mb-8">وێب سایت ئامار - Website Analytics</h2>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex flex-col items-center">
              <span className="text-neutral-400 text-sm mb-2 font-medium">ئەمڕۆ (Today)</span>
              <span className="text-3xl font-black text-red-500">{stats.today.toLocaleString()}</span>
            </div>
            
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex flex-col items-center">
              <span className="text-neutral-400 text-sm mb-2 font-medium">ئەم هەفتەیە (This Week)</span>
              <span className="text-3xl font-black text-blue-500">{stats.week.toLocaleString()}</span>
            </div>
            
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex flex-col items-center">
              <span className="text-neutral-400 text-sm mb-2 font-medium">ئەم مانگە (This Month)</span>
              <span className="text-3xl font-black text-emerald-500">{stats.month.toLocaleString()}</span>
            </div>
            
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex flex-col items-center">
              <span className="text-neutral-400 text-sm mb-2 font-medium">ئەم ساڵ (This Year)</span>
              <span className="text-3xl font-black text-purple-500">{stats.year.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-neutral-800">
           <span className="text-neutral-400 text-sm font-medium mr-2">کۆی گشتی (Total Visits):</span>
           <span className="text-xl font-bold text-white">{stats.total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
