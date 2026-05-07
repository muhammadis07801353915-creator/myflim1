
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function analyzeHistory() {
  console.log('--- Analyzing Movie History ---');
  
  const { data: movies } = await supabase
    .from('movies')
    .select('created_at')
    .order('created_at', { ascending: true });

  if (!movies) return;

  const dates = movies.map(m => m.created_at.split('T')[0]);
  const countsByDate = {};
  dates.forEach(d => countsByDate[d] = (countsByDate[d] || 0) + 1);
  
  console.log('Items added per day:');
  console.table(countsByDate);

  const { data: latest } = await supabase.from('movies').select('title, created_at').order('created_at', { ascending: false }).limit(5);
  console.log('\nLatest items added:');
  console.table(latest);
}

analyzeHistory();
