import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  // Oldest 3 records (to know when data started)
  const { data: oldest } = await supabase
    .from('site_visits')
    .select('created_at')
    .order('created_at', { ascending: true })
    .limit(3);
  console.log('\n=== Oldest 3 records (when data started) ===');
  oldest?.forEach(r => console.log(r.created_at));

  // Total count
  const { count: total } = await supabase
    .from('site_visits')
    .select('*', { count: 'exact', head: true });
  console.log('\n=== Total records ===', total);

  // Count by period (using UTC-aware approach)
  const now = new Date();
  
  // Iraq timezone is UTC+3
  const OFFSET_HOURS = 3;
  const nowLocal = new Date(now.getTime() + OFFSET_HOURS * 60 * 60 * 1000);
  
  // Start of today in Iraq time (UTC+3)
  const todayStartLocal = new Date(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), nowLocal.getUTCDate());
  const todayStartUTC = new Date(todayStartLocal.getTime() - OFFSET_HOURS * 60 * 60 * 1000);
  
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const [todayRes, weekRes, monthRes, yearRes] = await Promise.all([
    supabase.from('site_visits').select('*', { count: 'exact', head: true }).gte('created_at', todayStartUTC.toISOString()),
    supabase.from('site_visits').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
    supabase.from('site_visits').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo.toISOString()),
    supabase.from('site_visits').select('*', { count: 'exact', head: true }).gte('created_at', yearAgo.toISOString()),
  ]);

  console.log('\n=== Counts (Iraq UTC+3 aware) ===');
  console.log('Today start (UTC):', todayStartUTC.toISOString());
  console.log('Today:', todayRes.count);
  console.log('Last 7 days:', weekRes.count);
  console.log('Last 30 days:', monthRes.count);
  console.log('Last 365 days:', yearRes.count);
}

checkData();
