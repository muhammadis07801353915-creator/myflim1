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

// Cloudflare R2 public endpoint
const R2_BASE_URL = 'https://pub-2e0fad43910745bf8310497add3ae5fe.r2.dev';

/** Try fetching JSON from R2 — returns null on any failure */
async function fetchFromR2(key: string): Promise<any | null> {
  try {
    const res = await fetch(`${R2_BASE_URL}/${key}`, {
      next: { revalidate: 300 }, // cache 5 minutes
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchAllData() {
  // ── 1) Try Cloudflare R2 first (fastest, no egress limits) ────────────────
  try {
    const r2Data = await fetchFromR2('data.json');
    if (r2Data && Array.isArray(r2Data.movies) && r2Data.movies.length > 0) {
      console.log(`[fetchData] R2 hit: ${r2Data.movies.length} movies, ${r2Data.channels?.length ?? 0} channels`);
      return {
        movies:     r2Data.movies     ?? REAL_MOVIES,
        movieLists: r2Data.categories ?? REAL_CATEGORIES,
        channels:   r2Data.channels   ?? REAL_CHANNELS,
        categories: r2Data.channelCategories ?? REAL_CHANNEL_CATEGORIES,
        banners:    r2Data.banners    ?? REAL_BANNERS,
        countries:  r2Data.countries  ?? REAL_COUNTRIES,
      };
    }
  } catch (e) {
    console.warn('[fetchData] R2 fetch failed:', e);
  }

  // ── 2) Try Supabase ────────────────────────────────────────────────────────
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
    const hasChannels   = Array.isArray(channelsRes?.data) && channelsRes.data.length > 0;

    if (hasRealMovies || hasChannels) {
      console.log(`[fetchData] Supabase hit: ${moviesData?.length ?? 0} movies`);
      return {
        movies:     hasRealMovies ? moviesData : REAL_MOVIES,
        movieLists: (listsRes?.data  && listsRes.data.length  > 0) ? listsRes.data  : REAL_CATEGORIES,
        channels:   hasChannels ? channelsRes.data : REAL_CHANNELS,
        categories: (categoriesRes?.data && categoriesRes.data.length > 0) ? categoriesRes.data : REAL_CHANNEL_CATEGORIES,
        banners:    (bannersRes?.data    && bannersRes.data.length    > 0) ? bannersRes.data    : REAL_BANNERS,
        countries:  (countriesRes?.data  && countriesRes.data.length  > 0) ? countriesRes.data  : REAL_COUNTRIES,
      };
    }
  } catch (e) {
    console.warn('[fetchData] Supabase failed, using embedded realData:', e);
  }

  // ── 3) Final fallback: embedded realData.ts ────────────────────────────────
  console.log('[fetchData] Using embedded realData fallback');
  return {
    movies:     REAL_MOVIES,
    movieLists: REAL_CATEGORIES,
    channels:   REAL_CHANNELS,
    categories: REAL_CHANNEL_CATEGORIES,
    banners:    REAL_BANNERS,
    countries:  REAL_COUNTRIES,
  };
}
