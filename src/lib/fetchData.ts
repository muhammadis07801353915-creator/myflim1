import { createClient } from '@supabase/supabase-js';
import { fetchAllRows } from './supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

export async function fetchAllData() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
      },
    });

    const moviesData = await fetchAllRows(supabase, 'movies', 'created_at');

    const [listsRes, channelsRes, categoriesRes, bannersRes] = await Promise.all([
      supabase.from('movie_lists').select('*').order('order_index', { ascending: true }),
      supabase.from('channels').select('*').order('order_index', { ascending: true }),
      supabase.from('channel_categories').select('*').order('order_index', { ascending: true }),
      supabase.from('banners').select('*').order('order_index', { ascending: true })
    ]);

    return {
      movies: moviesData || [],
      movieLists: listsRes.data || [],
      channels: channelsRes.data || [],
      categories: categoriesRes.data || [],
      banners: bannersRes.data || [],
    };
  } catch (e) {
    console.error('Error fetching initial data in fetchAllData:', e);
    return {
      movies: [],
      movieLists: [],
      channels: [],
      categories: [],
      banners: [],
    };
  }
}
