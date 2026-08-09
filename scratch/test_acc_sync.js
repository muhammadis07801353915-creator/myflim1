const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://glqeflybndszpufqvwqf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscWVmbHlibmRzenB1ZnF2d3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzODU2NTUsImV4cCI6MjA1NTk2MTY1NX0.1i5W-O89bA4C-fC-347f_3g5t0j3b3s8g5h8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSync() {
  console.log('Testing settings query for accounts...');
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('key', 'taban_registered_user_accounts');

  console.log('Query result data:', data, 'error:', error);

  // Let's check profiles table
  const { data: profData, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .limit(10);
  console.log('Profiles table sample:', profData, 'error:', profErr);
}

testSync();
