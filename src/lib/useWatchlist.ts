'use client';

import { useState, useEffect } from 'react';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<any[]>([]);

  useEffect(() => {
    const load = () => {
      const stored = localStorage.getItem('myfilm_watchlist') || localStorage.getItem('myTV_watchlist');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setWatchlist(parsed);
          // Migrate old key if present
          localStorage.setItem('myfilm_watchlist', JSON.stringify(parsed));
        } catch (e) {
          console.error('Failed to parse watchlist', e);
        }
      }
    };
    load();

    window.addEventListener('storage', load);
    window.addEventListener('watchlistUpdated', load);
    return () => {
      window.removeEventListener('storage', load);
      window.removeEventListener('watchlistUpdated', load);
    };
  }, []);

  const addToWatchlist = (movie: any) => {
    const isExist = watchlist.some(m => String(m.id) === String(movie.id));
    if (isExist) return;
    const newWatchlist = [...watchlist, movie];
    setWatchlist(newWatchlist);
    localStorage.setItem('myfilm_watchlist', JSON.stringify(newWatchlist));
    localStorage.setItem('myTV_watchlist', JSON.stringify(newWatchlist));
    window.dispatchEvent(new Event('watchlistUpdated'));
  };

  const removeFromWatchlist = (id: number | string) => {
    const newWatchlist = watchlist.filter(m => String(m.id) !== String(id));
    setWatchlist(newWatchlist);
    localStorage.setItem('myfilm_watchlist', JSON.stringify(newWatchlist));
    localStorage.setItem('myTV_watchlist', JSON.stringify(newWatchlist));
    window.dispatchEvent(new Event('watchlistUpdated'));
  };

  const isInWatchlist = (id: number | string) => {
    return watchlist.some(m => String(m.id) === String(id));
  };

  const toggleWatchlist = (movie: any) => {
    if (isInWatchlist(movie.id)) {
      removeFromWatchlist(movie.id);
    } else {
      addToWatchlist(movie);
    }
  };

  return { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist, toggleWatchlist };
}
