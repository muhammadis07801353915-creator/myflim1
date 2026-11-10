'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, fetchAllRows } from './supabase';
import { 
  REAL_MOVIES, 
  REAL_CHANNELS, 
  REAL_CATEGORIES, 
  REAL_CHANNEL_CATEGORIES, 
  REAL_COUNTRIES, 
  REAL_BANNERS 
} from '../data/realData';

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
  const [movies, setMovies] = useState<any[]>(initialData?.movies?.length ? initialData.movies : REAL_MOVIES);
  const [movieLists, setMovieLists] = useState<any[]>(initialData?.movieLists?.length ? initialData.movieLists : REAL_CATEGORIES);
  const [channels, setChannels] = useState<any[]>(initialData?.channels?.length ? initialData.channels : REAL_CHANNELS);
  const [categories, setCategories] = useState<any[]>(initialData?.categories?.length ? initialData.categories : REAL_CHANNEL_CATEGORIES);
  const [banners, setBanners] = useState<any[]>(initialData?.banners?.length ? initialData.banners : REAL_BANNERS);
  const [countries, setCountries] = useState<any[]>(initialData?.countries?.length ? initialData.countries : REAL_COUNTRIES);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent && movies.length === 0) {
        setLoading(true);
      }
      
      const moviesData = await fetchAllRows(supabase, 'movies', 'created_at');
      
      const [listsRes, channelsRes, categoriesRes, bannersRes, countriesRes] = await Promise.all([
        supabase.from('movie_lists').select('*').order('order_index', { ascending: true }).then(r => r).catch(() => ({ data: [] })),
        supabase.from('channels').select('*').order('order_index', { ascending: true }).then(r => r).catch(() => ({ data: [] })),
        supabase.from('channel_categories').select('*').order('order_index', { ascending: true }).then(r => r).catch(() => ({ data: [] })),
        supabase.from('banners').select('*').order('order_index', { ascending: true }).then(r => r).catch(() => ({ data: [] })),
        supabase.from('channel_countries').select('*').order('order_index', { ascending: true }).then(r => r).catch(() => ({ data: [] }))
      ]);

      if (moviesData && moviesData.length > 0) {
        setMovies(moviesData);
      } else if (movies.length === 0) {
        setMovies(REAL_MOVIES);
      }

      if (listsRes?.data && listsRes.data.length > 0) {
        setMovieLists(listsRes.data);
      }
      if (channelsRes?.data && channelsRes.data.length > 0) {
        setChannels(channelsRes.data);
      }
      if (categoriesRes?.data && categoriesRes.data.length > 0) {
        setCategories(categoriesRes.data);
      }
      if (bannersRes?.data && bannersRes.data.length > 0) {
        setBanners(bannersRes.data);
      }
      if (countriesRes?.data && countriesRes.data.length > 0) {
        setCountries(countriesRes.data);
      }
    } catch (error) {
      console.warn('Supabase fetch failed, keeping fallback data:', error);
      if (movies.length === 0) setMovies(REAL_MOVIES);
      if (channels.length === 0) setChannels(REAL_CHANNELS);
    } finally {
      setLoading(false);
    }
  }, [movies.length, channels.length]);

  useEffect(() => {
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

  const refreshData = async () => {
    await fetchData(false);
  };

  return (
    <DataContext.Provider value={{ movies, movieLists, channels, categories, banners, countries, loading, refreshData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
