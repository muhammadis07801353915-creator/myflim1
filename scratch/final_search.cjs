
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function finalSearch() {
  console.log('--- Searching for Al Hayba and Rich Girl ---');
  
  const { data: movies, error } = await supabase
    .from('movies')
    .select('title, list_name, created_at')
    .or('title.ilike.%هەیبە%,title.ilike.%کچە زەنگین%,title.ilike.%کچە دەوڵەمەند%');
    
  if (error) {
    console.error('Search error:', error.message);
    return;
  }

  if (movies && movies.length > 0) {
    console.log(`Found ${movies.length} matches:`);
    console.table(movies);
  } else {
    console.log('No movies found with those names in this database.');
  }
}

finalSearch();
