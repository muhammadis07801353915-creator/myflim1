
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('--- Checking Database Status ---');
  
  const { count: movieCount, error: mError } = await supabase.from('movies').select('*', { count: 'exact', head: true });
  if (mError) console.error('Error counting movies:', mError);
  console.log('Total Movies:', movieCount);

  const { data: lists, error: lError } = await supabase.from('movie_lists').select('name');
  if (lError) console.error('Error fetching lists:', lError);
  console.log('Available Lists:', lists?.map(l => l.name));

  const { data: deletedListsCheck } = await supabase.from('movies').select('list_name').not('list_name', 'is', null);
  const uniqueListsInMovies = [...new Set(deletedListsCheck?.map(m => m.list_name))];
  console.log('Lists mentioned in movies table:', uniqueListsInMovies);
}

check();
