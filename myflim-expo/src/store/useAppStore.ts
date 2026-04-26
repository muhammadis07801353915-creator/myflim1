import { create } from 'zustand';
import { supabase } from '../api/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  movies: any[];
  series: any[];
  anime: any[];
  categories: any[];
  liveTv: any[];
  channelCategories: any[];
  watchlist: any[];
  user: {
    name: string;
    image: string;
    isPro: boolean;
  };
  theme: 'dark' | 'light';
  language: 'ku' | 'ar' | 'en';
  loading: boolean;
  error: string | null;
  
  fetchInitialData: () => Promise<void>;
  fetchMoviesByList: (listName: string) => Promise<any[]>;
  incrementViews: (id: string | number, currentViews: number) => Promise<void>;
  toggleWatchlist: (item: any) => Promise<void>;
  loadWatchlist: () => Promise<void>;
  updateUser: (data: Partial<{ name: string; image: string; isPro: boolean }>) => Promise<void>;
  toggleTheme: () => void;
  setLanguage: (lang: 'ku' | 'ar' | 'en') => void;
}

const DEFAULT_USER = {
  name: 'User Name',
  image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
  isPro: false,
};

export const useAppStore = create<AppState>((set, get) => ({
  movies: [],
  series: [],
  anime: [],
  categories: [],
  liveTv: [],
  channelCategories: [],
  watchlist: [],
  user: DEFAULT_USER,
  theme: 'dark',
  language: 'ku', // Default language is Kurdish
  loading: false,
  error: null,

  fetchInitialData: async () => {
    set({ loading: true, error: null });
    try {
      // Parallel fetch from Supabase
      const [
        { data: allMovies, error: moviesError },
        { data: movieLists, error: listsError },
        { data: channels, error: channelsError },
        { data: channelCats, error: catError }
      ] = await Promise.all([
        supabase.from('movies').select('*').order('id', { ascending: false }),
        supabase.from('movie_lists').select('*').order('order_index', { ascending: true }),
        supabase.from('channels').select('*').order('order_index', { ascending: true }),
        supabase.from('channel_categories').select('*').order('order_index', { ascending: true })
      ]);

      if (moviesError) throw moviesError;
      if (listsError) throw listsError;
      if (channelsError) throw channelsError;
      if (catError) throw catError;

      // Type-based filtering for main content
      const movies = allMovies?.filter(item => item.type === 'Movie') || [];
      const series = allMovies?.filter(item => item.type === 'Series') || [];
      const anime = allMovies?.filter(item => 
        item.genre?.includes('Anime') || 
        item.genre?.includes('Animation') ||
        item.type === 'Anime'
      ) || [];

      // Load Local Storage
      let storedWatchlist = [];
      let storedUser = DEFAULT_USER;
      let storedTheme: 'dark' | 'light' = 'dark';
      let storedLanguage: 'ku' | 'ar' | 'en' = 'ku';

      try {
        const w = await AsyncStorage.getItem('watchlist');
        if (w) storedWatchlist = JSON.parse(w);
        
        const u = await AsyncStorage.getItem('user_data');
        if (u) {
          const parsed = JSON.parse(u);
          storedUser = { ...DEFAULT_USER, ...parsed };
        }

        const t = await AsyncStorage.getItem('app_theme');
        if (t === 'light' || t === 'dark') storedTheme = t;

        const lang = await AsyncStorage.getItem('app_language');
        if (lang === 'ku' || lang === 'ar' || lang === 'en') storedLanguage = lang as 'ku'|'ar'|'en';
      } catch (e) {
        console.warn('AsyncStorage error:', e);
      }

      set({ 
        movies,
        series,
        anime,
        categories: movieLists || [],
        liveTv: channels || [],
        channelCategories: channelCats || [],
        watchlist: storedWatchlist,
        user: storedUser,
        theme: storedTheme,
        language: storedLanguage,
        loading: false 
      });
    } catch (err: any) {
      console.error('Fetch error:', err);
      set({ error: err.message, loading: false });
    }
  },

  fetchMoviesByList: async (listName: string) => {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('list_name', listName)
      .order('id', { ascending: false });
    
    if (error) return [];
    return data || [];
  },

  incrementViews: async (id: string | number, currentViews: number) => {
    try {
      await supabase.from('movies').update({ views: (currentViews || 0) + 1 }).eq('id', id);
    } catch (err) {
      console.error('Error incrementing views:', err);
    }
  },

  loadWatchlist: async () => {
    try {
      const stored = await AsyncStorage.getItem('watchlist');
      if (stored) {
        set({ watchlist: JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Error loading watchlist:', e);
    }
  },

  toggleWatchlist: async (item: any) => {
    const { watchlist } = get();
    const isExist = watchlist.find(i => String(i.id) === String(item.id));
    let newWatchlist;
    
    if (isExist) {
      newWatchlist = watchlist.filter(i => String(i.id) !== String(item.id));
    } else {
      newWatchlist = [...watchlist, item];
    }
    
    set({ watchlist: newWatchlist });
    await AsyncStorage.setItem('watchlist', JSON.stringify(newWatchlist));
  },

  updateUser: async (data: Partial<{ name: string; image: string; isPro: boolean }>) => {
    const newUser = { ...get().user, ...data };
    set({ user: newUser });
    await AsyncStorage.setItem('user_data', JSON.stringify(newUser));
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: newTheme });
    AsyncStorage.setItem('app_theme', newTheme);
  },

  setLanguage: (lang: 'ku' | 'ar' | 'en') => {
    set({ language: lang });
    AsyncStorage.setItem('app_language', lang);
  }
}));
