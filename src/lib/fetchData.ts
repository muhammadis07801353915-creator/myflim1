import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

export async function fetchAllData() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const [moviesRes, listsRes, channelsRes, categoriesRes, bannersRes] = await Promise.all([
    supabase.from('movies').select('*').order('created_at', { ascending: false }),
    supabase.from('movie_lists').select('*').order('order_index', { ascending: true }),
    supabase.from('channels').select('*').order('order_index', { ascending: true }),
    supabase.from('channel_categories').select('*').order('order_index', { ascending: true }),
    supabase.from('banners').select('*').order('order_index', { ascending: true })
  ]);

  return {
    movies: moviesRes.data || [],
    movieLists: listsRes.data || [],
    channels: channelsRes.data || [],
    categories: categoriesRes.data || [],
    banners: bannersRes.data || [],
  };
}
