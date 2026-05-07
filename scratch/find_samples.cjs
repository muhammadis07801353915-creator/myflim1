
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findMissingSample() {
  console.log('--- Searching for samples from missing lists ---');
  
  const { data: movies } = await supabase
    .from('movies')
    .select('title, list_name')
    .ilike('list_name', '%کوردی%')
    .limit(10);
    
  console.log('Sample movies with "کوردی" in list name:');
  console.table(movies);
}

findMissingSample();
