'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

interface DataContextType {
  movies: any[];
  movieLists: any[];
  channels: any[];
  categories: any[];
  banners: any[];
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
}

export function DataProvider({ children, initialData }: { children: React.ReactNode; initialData?: InitialData }) {
  const [movies, setMovies] = useState<any[]>(initialData?.movies || []);
  const [movieLists, setMovieLists] = useState<any[]>(initialData?.movieLists || []);
  const [channels, setChannels] = useState<any[]>(initialData?.channels || []);
  const [categories, setCategories] = useState<any[]>(initialData?.categories || []);
  const [banners, setBanners] = useState<any[]>(initialData?.banners || []);
  const [loading, setLoading] = useState(!initialData);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [moviesRes, listsRes, channelsRes, categoriesRes, bannersRes] = await Promise.all([
        supabase.from('movies').select('*').order('created_at', { ascending: false }),
        supabase.from('movie_lists').select('*').order('order_index', { ascending: true }),
        supabase.from('channels').select('*').order('order_index', { ascending: true }),
        supabase.from('channel_categories').select('*').order('order_index', { ascending: true }),
        supabase.from('banners').select('*').order('order_index', { ascending: true })
      ]);

      if (moviesRes.data) setMovies(moviesRes.data);
      if (listsRes.data) setMovieLists(listsRes.data);
      if (channelsRes.data) setChannels(channelsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (bannersRes.data) setBanners(bannersRes.data);
    } catch (error) {
      console.error('Error fetching global data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch client-side if no initial data was provided
    if (!initialData) {
      fetchData();
    }
  }, [initialData, fetchData]);

  return (
    <DataContext.Provider value={{ movies, movieLists, channels, categories, banners, loading, refreshData: fetchData }}>
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
