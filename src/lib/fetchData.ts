import { createClient } from '@supabase/supabase-js';
import { fetchAllRows } from './supabase';
import { 
  REAL_MOVIES, 
  REAL_CHANNELS, 
  REAL_CATEGORIES, 
  REAL_CHANNEL_CATEGORIES, 
  REAL_COUNTRIES, 
  REAL_BANNERS 
} from '../data/realData';

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

    const [listsRes, channelsRes, categoriesRes, bannersRes, countriesRes] = await Promise.all([
      supabase.from('movie_lists').select('*').order('order_index', { ascending: true }).then(r => r).catch(e => ({ data: [], error: e })),
      supabase.from('channels').select('*').order('order_index', { ascending: true }).then(r => r).catch(e => ({ data: [], error: e })),
      supabase.from('channel_categories').select('*').order('order_index', { ascending: true }).then(r => r).catch(e => ({ data: [], error: e })),
      supabase.from('banners').select('*').order('order_index', { ascending: true }).then(r => r).catch(e => ({ data: [], error: e })),
      supabase.from('channel_countries').select('*').order('order_index', { ascending: true }).then(r => r).catch(e => ({ data: [], error: e }))
    ]);

    const hasRealMovies = Array.isArray(moviesData) && moviesData.length > 0;
    const hasChannels = Array.isArray(channelsRes?.data) && channelsRes.data.length > 0;

    return {
      movies: hasRealMovies ? moviesData : REAL_MOVIES,
      movieLists: (listsRes?.data && listsRes.data.length > 0) ? listsRes.data : REAL_CATEGORIES,
      channels: hasChannels ? channelsRes.data : REAL_CHANNELS,
      categories: (categoriesRes?.data && categoriesRes.data.length > 0) ? categoriesRes.data : REAL_CHANNEL_CATEGORIES,
      banners: (bannersRes?.data && bannersRes.data.length > 0) ? bannersRes.data : REAL_BANNERS,
      countries: (countriesRes?.data && countriesRes.data.length > 0) ? countriesRes.data : REAL_COUNTRIES,
    };
  } catch (e) {
    console.error('Error fetching initial data in fetchAllData, falling back to embedded realData:', e);
    return {
      movies: REAL_MOVIES,
      movieLists: REAL_CATEGORIES,
      channels: REAL_CHANNELS,
      categories: REAL_CHANNEL_CATEGORIES,
      banners: REAL_BANNERS,
      countries: REAL_COUNTRIES,
    };
  }
}
