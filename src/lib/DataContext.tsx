'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, fetchAllRows } from './supabase';

interface DataContextType {
  movies: any[];
  movieLists: any[];
  channels: any[];
  categories: any[];
  banners: any[];
  countries: any[];
  loading: boolean;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface InitialData {
  movies: any[];
  movieLists: any[];
  channels: any[];
  categories: any[];
  banners: any[];
  countries: any[];
}

export function DataProvider({ children, initialData }: { children: React.ReactNode; initialData?: InitialData }) {
  const [movies, setMovies] = useState<any[]>(initialData?.movies || []);
  const [movieLists, setMovieLists] = useState<any[]>(initialData?.movieLists || []);
  const [channels, setChannels] = useState<any[]>(initialData?.channels || []);
  const [categories, setCategories] = useState<any[]>(initialData?.categories || []);
  const [banners, setBanners] = useState<any[]>(initialData?.banners || []);
  const [countries, setCountries] = useState<any[]>(initialData?.countries || []);
  const [loading, setLoading] = useState(!initialData);

  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent && movies.length === 0) {
        setLoading(true);
      }
      
      const moviesData = await fetchAllRows(supabase, 'movies', 'created_at');
      
      const [listsRes, channelsRes, categoriesRes, bannersRes, countriesRes] = await Promise.all([
        supabase.from('movie_lists').select('*').order('order_index', { ascending: true }).then(r => r).catch(e => ({ data: [], error: e })),
        supabase.from('channels').select('*').order('order_index', { ascending: true }).then(r => r).catch(e => ({ data: [], error: e })),
        supabase.from('channel_categories').select('*').order('order_index', { ascending: true }).then(r => r).catch(e => ({ data: [], error: e })),
        supabase.from('banners').select('*').order('order_index', { ascending: true }).then(r => r).catch(e => ({ data: [], error: e })),
        supabase.from('channel_countries').select('*').order('order_index', { ascending: true }).then(r => r).catch(e => ({ data: [], error: e }))
      ]);

      setMovies(moviesData || []);
      if (listsRes?.data) setMovieLists(listsRes.data);
      if (channelsRes?.data) setChannels(channelsRes.data);
      if (categoriesRes?.data) setCategories(categoriesRes.data);
      if (bannersRes?.data) setBanners(bannersRes.data);
      if (countriesRes?.data) setCountries(countriesRes.data);
    } catch (error) {
      console.error('Error fetching global data:', error);
    } finally {
      // Only hide loading if we actually have data now
      setLoading(false);
    }
  }, [movies.length]);

  useEffect(() => {
    // Always fetch fresh data on mount (ensures new tables like channel_countries load)
    fetchData();

    // Subscribe to realtime changes for all tables
    const moviesSub = supabase.channel('movies-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'movies' }, () => fetchData(true))
      .subscribe();
      
    const channelsSub = supabase.channel('channels-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channels' }, () => fetchData(true))
      .subscribe();

    const listsSub = supabase.channel('lists-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'movie_lists' }, () => fetchData(true))
      .subscribe();

    const bannersSub = supabase.channel('banners-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, () => fetchData(true))
      .subscribe();

    const categoriesSub = supabase.channel('categories-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channel_categories' }, () => fetchData(true))
      .subscribe();

    const countriesSub = supabase.channel('countries-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channel_countries' }, () => fetchData(true))
      .subscribe();

    return () => {
      supabase.removeChannel(moviesSub);
      supabase.removeChannel(channelsSub);
      supabase.removeChannel(listsSub);
      supabase.removeChannel(bannersSub);
      supabase.removeChannel(categoriesSub);
      supabase.removeChannel(countriesSub);
    };
  }, [fetchData]);

  return (
    <DataContext.Provider value={{ movies, movieLists, channels, categories, banners, countries, loading, refreshData: fetchData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
