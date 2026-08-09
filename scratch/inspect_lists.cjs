const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectLists() {
  const { data: movieLists, error } = await supabase.from('movie_lists').select('*');
  if (error) {
    console.error('Error fetching movie_lists:', error);
    return;
  }
  console.log('--- ALL MOVIE LISTS ---');
  console.log(JSON.stringify(movieLists, null, 2));
}

inspectLists();
