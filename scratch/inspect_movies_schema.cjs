const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectMovies() {
  const { data: sampleMovies, error } = await supabase.from('movies').select('*').limit(5);
  if (error) {
    console.error('Error fetching movies:', error);
    return;
  }
  console.log('--- SAMPLE MOVIE KEYS ---');
  if (sampleMovies && sampleMovies.length > 0) {
    console.log(Object.keys(sampleMovies[0]));
    console.log('Sample movie object:', JSON.stringify(sampleMovies[0], null, 2));
  }
}

inspectMovies();
