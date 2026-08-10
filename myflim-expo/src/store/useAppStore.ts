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
  countries: any[];
  banners: any[];
  watchlist: any[];
  watchHistory: Record<string, { item: any; timestamp: number; duration: number; updatedAt: number }>;
  user: {
    name: string;
    image: string;
    isPro: boolean;
  };
  theme: 'dark' | 'light';
  language: 'ku' | 'ar' | 'en';
  loading: boolean;
  error: string | null;
  isUnlocked: boolean;
  notifications: any[];
  unreadNotifCount: number;
  
  fetchInitialData: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markNotificationsRead: () => Promise<void>;
  unlockApp: (code: string) => Promise<boolean>;
  fetchMoviesByList: (listName: string) => Promise<any[]>;
  incrementViews: (id: string | number, currentViews: number) => Promise<void>;
  toggleWatchlist: (item: any) => Promise<void>;
  loadWatchlist: () => Promise<void>;
  saveWatchProgress: (item: any, timestamp: number, duration: number) => Promise<void>;
  removeFromHistory: (itemId: string | number) => Promise<void>;
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
  countries: [],
  banners: [],
  watchlist: [],
  watchHistory: {},
  user: DEFAULT_USER,
  notifications: [],
  unreadNotifCount: 0,

  fetchNotifications: async () => {
    try {
      let fetchedNotifs: any[] = [];

      // 1. Try fetching from notifications table
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        fetchedNotifs = data;
      }

      // 2. Also check settings table for fallback/backup items
      const { data: sData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'app_notifications_list')
        .maybeSingle();

      if (sData?.value) {
        try {
          const sList = JSON.parse(sData.value);
          fetchedNotifs = Array.from(new Map([...fetchedNotifs, ...sList].map((item: any) => [item.id || item.created_at, item])).values());
          fetchedNotifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } catch {}
      }

      const lastReadTimeStr = await AsyncStorage.getItem('last_read_notif_time');
      const lastReadTime = lastReadTimeStr ? new Date(lastReadTimeStr).getTime() : 0;

      const unread = fetchedNotifs.filter((n: any) => new Date(n.created_at).getTime() > lastReadTime).length;

      set({
        notifications: fetchedNotifs,
        unreadNotifCount: unread
      });
    } catch (e) {
      console.warn('Error fetching notifications:', e);
    }
  },

  markNotificationsRead: async () => {
    const futureTimeIso = new Date(Date.now() + 10000).toISOString();
    set({ unreadNotifCount: 0 });
    await AsyncStorage.setItem('last_read_notif_time', futureTimeIso);
  },

  unlockApp: async (code: string) => {
    if (code.toLowerCase() === 'myflim1') {
      set({ isUnlocked: true });
      await AsyncStorage.setItem('app_unlocked', 'true');

      // Record this login in user_logins table
      try {
        // Get or create a unique device ID
        let deviceId = await AsyncStorage.getItem('device_id');
        if (!deviceId) {
          deviceId = 'app_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
          await AsyncStorage.setItem('device_id', deviceId);
        }
        await supabase.from('user_logins').insert([{
          source: 'app_code',
          device_id: deviceId,
          code_used: code.toLowerCase(),
        }]);
      } catch (e) {
        // Safe to ignore if table not ready
        console.warn('user_logins insert failed:', e);
      }

      return true;
    }
    return false;
  },

  fetchInitialData: async () => {
    const isAlreadyLoaded = get().movies.length > 0;
    if (!isAlreadyLoaded) {
      set({ loading: true, error: null });
    }
    try {
      // Helper to fetch all rows bypassing 1000 limit
      const fetchAllRows = async (table: string, orderColumn: string, ascending = false) => {
        let allData: any[] = [];
        let from = 0;
        const step = 1000;
        
        while (true) {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .order(orderColumn, { ascending })
            .range(from, from + step - 1);
            
          if (error) {
            console.error(`Error fetching ${table}:`, error);
            break;
          }
          if (data && data.length > 0) {
            allData = [...allData, ...data];
            if (data.length < step) break;
            from += step;
          } else {
            break;
          }
        }
        return allData;
      };

      // Parallel fetch from Supabase
      const [
        allMovies,
        { data: movieLists, error: listsError },
        { data: channels, error: channelsError },
        { data: channelCats, error: catError },
        { data: bannersData, error: bannersError },
        { data: countriesData, error: countriesError }
      ] = await Promise.all([
        fetchAllRows('movies', 'id', false),
        supabase.from('movie_lists').select('*').order('order_index', { ascending: true }),
        supabase.from('channels').select('*').order('order_index', { ascending: true }),
        supabase.from('channel_categories').select('*').order('order_index', { ascending: true }),
        supabase.from('banners').select('*').order('order_index', { ascending: true }),
        supabase.from('channel_countries').select('*').eq('is_active', true).order('order_index', { ascending: true })
      ]);

      if (listsError) throw listsError;
      if (channelsError) throw channelsError;
      if (catError) throw catError;
      if (bannersError) throw bannersError;

      // Type-based filtering for main content
      const movies = allMovies?.filter(item => item.type === 'Movie') || [];
      const series = allMovies?.filter(item => item.type === 'Series') || [];
      const anime = allMovies?.filter(item => 
        item.type === 'Anime' ||
        (item.genre && /anime|animation|cartoon|کارتۆن|ئەنیمەیشن/i.test(item.genre)) ||
        (item.list_name && /کارتۆن|ئەنیمەیشن|ئەنیمی|anime|cartoon/i.test(item.list_name))
      ) || [];

      // All content (movies + series + anime) for list-based filtering
      const allContent = allMovies || [];

      // Load Local Storage
      let storedWatchlist = [];
      let storedUser = DEFAULT_USER;
      let storedTheme: 'dark' | 'light' = 'dark';
      let storedLanguage: 'ku' | 'ar' | 'en' = 'ku';
      let storedUnlocked = false;

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
        
        const un = await AsyncStorage.getItem('app_unlocked');
        if (un === 'true') storedUnlocked = true;
      } catch (e) {
        console.warn('AsyncStorage error:', e);
      }

      set({ 
        movies: allContent,
        series,
        anime,
        categories: movieLists || [],
        liveTv: channels || [],
        channelCategories: channelCats || [],
        banners: bannersData || [],
        countries: countriesData || [],
        watchlist: storedWatchlist,
        watchHistory: (() => {
          try {
            const h = AsyncStorage.getItem('watch_history');
            return h ? JSON.parse(h as any) : {};
          } catch {
            return {};
          }
        })(),
        user: storedUser,
        theme: storedTheme,
        language: storedLanguage,
        isUnlocked: storedUnlocked,
        loading: false 
      });

      get().fetchNotifications();
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

    try {
      const savedUid = await AsyncStorage.getItem('taban_app_device_user_id');
      if (savedUid) {
        const syncKey = `user_watchlist_${savedUid}`;
        const { data: existing } = await supabase.from('settings').select('id').eq('key', syncKey).maybeSingle();
        if (existing?.id) {
          await supabase.from('settings').update({ value: JSON.stringify(newWatchlist) }).eq('key', syncKey);
        } else {
          await supabase.from('settings').insert([{ key: syncKey, value: JSON.stringify(newWatchlist) }]);
        }
      }
    } catch (e) {}
  },

  saveWatchProgress: async (item: any, timestamp: number, duration: number) => {
    const current = get().watchHistory || {};
    const updated = {
      ...current,
      [String(item.id)]: {
        item,
        timestamp,
        duration,
        updatedAt: Date.now()
      }
    };
    set({ watchHistory: updated });
    await AsyncStorage.setItem('watch_history', JSON.stringify(updated));

    try {
      const savedUid = await AsyncStorage.getItem('taban_app_device_user_id');
      if (savedUid) {
        const syncKey = `user_history_${savedUid}`;
        const { data: existing } = await supabase.from('settings').select('id').eq('key', syncKey).maybeSingle();
        if (existing?.id) {
          await supabase.from('settings').update({ value: JSON.stringify(updated) }).eq('key', syncKey);
        } else {
          await supabase.from('settings').insert([{ key: syncKey, value: JSON.stringify(updated) }]);
        }
      }
    } catch (e) {}
  },

  removeFromHistory: async (itemId: string | number) => {
    const current = get().watchHistory || {};
    const updated = { ...current };
    delete updated[String(itemId)];
    set({ watchHistory: updated });
    await AsyncStorage.setItem('watch_history', JSON.stringify(updated));

    try {
      const savedUid = await AsyncStorage.getItem('taban_app_device_user_id');
      if (savedUid) {
        const syncKey = `user_history_${savedUid}`;
        const { data: existing } = await supabase.from('settings').select('id').eq('key', syncKey).maybeSingle();
        if (existing?.id) {
          await supabase.from('settings').update({ value: JSON.stringify(updated) }).eq('key', syncKey);
        }
      }
    } catch (e) {}
  },

  updateUser: async (data: Partial<{ name: string; image: string; isPro: boolean }>) => {
    const newUser = { ...get().user, ...data };
    set({ user: newUser });
    await AsyncStorage.setItem('user_data', JSON.stringify(newUser));

    try {
      const savedUid = await AsyncStorage.getItem('taban_app_device_user_id');
      if (savedUid && newUser.name) {
        await supabase.from('profiles').upsert({
          id: savedUid,
          display_name: newUser.name,
          avatar_url: newUser.image,
          updated_at: new Date().toISOString()
        });

        const { data: sData } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'taban_registered_user_accounts')
          .maybeSingle();

        if (sData && sData.value) {
          const accs = JSON.parse(sData.value);
          const match = accs.find((a: any) => a.id === savedUid || a.username.toLowerCase() === newUser.name.toLowerCase());
          if (match) {
            match.avatar = newUser.image;
            match.username = newUser.name;
            await supabase
              .from('settings')
              .update({ value: JSON.stringify(accs) })
              .eq('key', 'taban_registered_user_accounts');
          }
        }
      }
    } catch (e) {
      console.warn('Update user avatar sync warning:', e);
    }
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
