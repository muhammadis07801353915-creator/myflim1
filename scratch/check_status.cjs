
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStatus() {
  console.log('--- Checking Movie Statuses ---');
  
  const { data: statusCounts, error } = await supabase.from('movies').select('status');
  if (error) return;

  const counts = {};
  statusCounts.forEach(m => counts[m.status] = (counts[m.status] || 0) + 1);
  console.table(counts);

  const { data: brokenOnes } = await supabase.from('movies').select('title').eq('is_broken', true);
  console.log('Broken movies count:', brokenOnes?.length || 0);
}

checkStatus();
