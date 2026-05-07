
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkMismatch() {
  console.log('--- Checking for List Name Mismatches ---');
  
  // 1. Get all actual list names from movie_lists
  const { data: listRows } = await supabase.from('movie_lists').select('name');
  const validListNames = new Set(listRows?.map(l => l.name) || []);
  console.log('Valid lists in database:', [...validListNames]);

  // 2. Get all unique list_names used in movies table
  const { data: movieRows } = await supabase.from('movies').select('list_name').not('list_name', 'is', null);
  const usedListNames = [...new Set(movieRows?.map(m => m.list_name))];
  
  console.log('\nList names currently used by movies:');
  for (const name of usedListNames) {
    const isMissing = !validListNames.has(name);
    const { count } = await supabase.from('movies').select('*', { count: 'exact', head: true }).eq('list_name', name);
    console.log(`- "${name}": ${count} items ${isMissing ? ' [⚠️ NOT IN MOVIE_LISTS TABLE]' : '[OK]'}`);
  }
}

checkMismatch();
