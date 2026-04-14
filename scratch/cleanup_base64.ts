
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ojtnsvbofjfqabfdbigx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdG5zdmJvZmpmcWFiZmRiaWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODU4MTQsImV4cCI6MjA5MTA2MTgxNH0.sa1ZqHiD7VPgHYRcJeI-7YD01C54HqESaUtHhxLyRoE';
const TMDB_API_KEY = 'c2607383b5fe48c445465d4e8b1ded29';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function searchTMDB(title: string, type: string) {
  const mediaType = type === 'Series' ? 'tv' : 'movie';
  try {
    const resp = await fetch(`https://api.themoviedb.org/3/search/${mediaType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
    const data = await resp.json();
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        image: result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : null,
        backdrop: result.backdrop_path ? `https://image.tmdb.org/t/p/original${result.backdrop_path}` : null
      };
    }
  } catch (e) {
    console.error(`Error searching TMDB for ${title}:`, e);
  }
  return null;
}

async function cleanupBanners() {
  console.log('--- Cleaning up Banners ---');
  const { data: banners, error } = await supabase.from('banners').select('*');
  if (error) {
    console.error('Error fetching banners:', error);
    return;
  }

  for (const banner of banners) {
    if (banner.image && banner.image.startsWith('data:image')) {
      console.log(`Replacing Base64 image in banner ${banner.id}`);
      const placeholder = 'https://placehold.co/1200x600/1a1d24/white?text=Update+Banner+Image';
      const { error: updateError } = await supabase.from('banners').update({ image: placeholder }).eq('id', banner.id);
      if (updateError) console.error(`Error updating banner ${banner.id}:`, updateError);
    }
  }
}

async function cleanupMovies() {
  console.log('--- Cleaning up Movies & Series ---');
  const { data: movies, error } = await supabase.from('movies').select('*');
  if (error) {
    console.error('Error fetching movies:', error);
    return;
  }

  for (const movie of movies) {
    const isImageBase64 = movie.image && movie.image.startsWith('data:image');
    const isBackdropBase64 = movie.backdrop && movie.backdrop.startsWith('data:image');

    if (isImageBase64 || isBackdropBase64) {
      console.log(`Attempting to find TMDB URL for: ${movie.title} (${movie.type})`);
      const tmdbData = await searchTMDB(movie.title, movie.type);
      
      const updates: any = {};
      if (isImageBase64) {
        updates.image = tmdbData?.image || 'https://placehold.co/500x750/1a1d24/white?text=No+Poster';
      }
      if (isBackdropBase64) {
        updates.backdrop = tmdbData?.backdrop || 'https://placehold.co/1200x600/1a1d24/white?text=No+Backdrop';
      }

      if (Object.keys(updates).length > 0) {
        console.log(`Updating ${movie.title}...`);
        const { error: updateError } = await supabase.from('movies').update(updates).eq('id', movie.id);
        if (updateError) console.error(`Error updating movie ${movie.id}:`, updateError);
      }
    }
  }
}

async function cleanupChannels() {
  console.log('--- Cleaning up Channels ---');
  const { data: channels, error } = await supabase.from('channels').select('*');
  if (error) {
    console.error('Error fetching channels:', error);
    return;
  }

  for (const channel of channels) {
    if (channel.image && channel.image.startsWith('data:image')) {
      console.log(`Replacing Base64 logo in channel ${channel.name}`);
      const placeholder = 'https://placehold.co/200x200/1a1d24/white?text=Logo';
      const { error: updateError } = await supabase.from('channels').update({ image: placeholder }).eq('id', channel.id);
      if (updateError) console.error(`Error updating channel ${channel.id}:`, updateError);
    }
  }
}

async function run() {
  // await cleanupBanners();
  // await cleanupMovies();
  await cleanupChannels();
  console.log('Final Cleanup complete!');
}

run();
