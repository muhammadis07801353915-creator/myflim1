
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCounts() {
  console.log('--- Checking Counts per List ---');
  
  const { data: lists } = await supabase.from('movie_lists').select('name');
  
  for (const list of lists) {
    const { count } = await supabase.from('movies').select('*', { count: 'exact', head: true }).eq('list_name', list.name);
    console.log(`${list.name}: ${count} items`);
  }
}

checkCounts();
