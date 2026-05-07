
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixOrphanedMovies() {
  console.log('--- Fixing Orphaned Movies ---');
  
  // 1. Get valid list names
  const { data: listRows } = await supabase.from('movie_lists').select('name');
  const validListNames = new Set(listRows?.map(l => l.name) || []);

  // 2. Find movies whose list_name is NOT in the valid list names
  const { data: movies } = await supabase.from('movies').select('id, title, list_name').limit(2000);
  
  const orphanedMovies = movies.filter(m => !m.list_name || !validListNames.has(m.list_name));
  console.log(`Found ${orphanedMovies.length} orphaned movies (no valid list).`);

  if (orphanedMovies.length > 0) {
    console.log('Moving orphaned movies to "فیلمەکانی جیهان"...');
    const idsToUpdate = orphanedMovies.map(m => m.id);
    
    // Split into chunks to update
    const chunkSize = 100;
    for (let i = 0; i < idsToUpdate.length; i += chunkSize) {
      const chunk = idsToUpdate.slice(i, i + chunkSize);
      const { error } = await supabase
        .from('movies')
        .update({ list_name: 'فیلمەکانی جیهان' })
        .in('id', chunk);
      
      if (error) {
        console.error('Error updating chunk:', error.message);
      } else {
        console.log(`Updated chunk of ${chunk.length} movies.`);
      }
    }
  }
}

fixOrphanedMovies();
