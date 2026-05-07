
const { createClient } = require('@supabase/supabase-js');

// The OTHER database URL found in cleanup_base64.ts
const otherUrl = 'https://ojtnsvbofjfqabfdbigx.supabase.co';
const otherKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdG5zdmJvZmpmcWFiZmRiaWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODU4MTQsImV4cCI6MjA5MTA2MTgxNH0.sa1ZqHiD7VPgHYRcJeI-7YD01C54HqESaUtHhxLyRoE';

const otherSupabase = createClient(otherUrl, otherKey);

async function checkOtherDb() {
  console.log('--- Checking Other Database ---');
  try {
    const { count, error } = await otherSupabase.from('movies').select('*', { count: 'exact', head: true });
    if (error) {
       console.log('Other DB might be inaccessible or empty:', error.message);
       return;
    }
    console.log('Total Movies in Other DB:', count);
    
    const { data: samples } = await otherSupabase.from('movies').select('title').limit(5);
    console.log('Sample movies from Other DB:', samples?.map(s => s.title));
  } catch (e) {
    console.log('Error accessing other DB');
  }
}

checkOtherDb();
