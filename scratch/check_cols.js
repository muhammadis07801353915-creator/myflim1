import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ojtnsvbofjfqabfdbigx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdG5zdmJvZmpmcWFiZmRiaWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODU4MTQsImV4cCI6MjA5MTA2MTgxNH0.sa1ZqHiD7VPgHYRcJeI-7YD01C54HqESaUtHhxLyRoE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCols() {
  const { data, error } = await supabase.from('movies').select('*').limit(1);
  if (error) {
    console.error(error);
  } else if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
  } else {
    // If table is empty, try to get column info from a different table or assume something
    console.log('Table is empty');
  }
}

checkCols();
