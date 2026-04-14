import { useState, useEffect } from 'react';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('myTV_watchlist');
    if (stored) {
      try {
        setWatchlist(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse watchlist', e);
      }
    }
  }, []);

  const addToWatchlist = (movie: any) => {
    const newWatchlist = [...watchlist, movie];
    setWatchlist(newWatchlist);
    localStorage.setItem('myTV_watchlist', JSON.stringify(newWatchlist));
  };

  const removeFromWatchlist = (id: number) => {
    const newWatchlist = watchlist.filter(m => m.id !== id);
    setWatchlist(newWatchlist);
    localStorage.setItem('myTV_watchlist', JSON.stringify(newWatchlist));
  };

  const isInWatchlist = (id: number) => {
    return watchlist.some(m => m.id === id);
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
