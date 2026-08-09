const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateAnimationToKarton() {
  console.log('Fetching all movies...');
  const { data: movies, error } = await supabase.from('movies').select('*');
  if (error) {
    console.error('Error fetching movies:', error);
    return;
  }

  // Filter movies that were in the "Animation / Anime" section
  const animationMovies = movies.filter(m => 
    (m.genre && (m.genre.toLowerCase().includes('animation') || m.genre.toLowerCase().includes('anime'))) ||
    m.type === 'Anime'
  );

  console.log(`Found ${animationMovies.length} animation/anime movies.`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const movie of animationMovies) {
    if (movie.list_name === 'کارتۆنی نوێ') {
      console.log(`Skipping "${movie.title}" (ID: ${movie.id}) - already in "کارتۆنی نوێ"`);
      skippedCount++;
    } else {
      console.log(`Migrating "${movie.title}" (ID: ${movie.id}) from list "${movie.list_name}" -> "کارتۆنی نوێ"`);
      const { error: updateError } = await supabase
        .from('movies')
        .update({ list_name: 'کارتۆنی نوێ' })
        .eq('id', movie.id);

      if (updateError) {
        console.error(`Failed to update movie ID ${movie.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }

  console.log('\n--- MIGRATION COMPLETE ---');
  console.log(`Successfully migrated to "کارتۆنی نوێ": ${updatedCount}`);
  console.log(`Already in "کارتۆنی نوێ" (skipped): ${skippedCount}`);

  // Also check if there's any row in 'movie_lists' table named 'ئەنیمەیشنەکان' or 'Animation'
  const { data: movieLists } = await supabase.from('movie_lists').select('*');
  const animLists = (movieLists || []).filter(l => 
    l.name === 'ئەنیمەیشنەکان' || 
    l.name === 'Animation' || 
    l.name_en === 'Animation'
  );

  for (const list of animLists) {
    console.log(`Deleting list "${list.name}" (ID: ${list.id}) from movie_lists table...`);
    await supabase.from('movie_lists').delete().eq('id', list.id);
  }
}

migrateAnimationToKarton();
