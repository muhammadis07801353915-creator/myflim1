import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  // Check all records
  const { data, count } = await supabase
    .from('user_logins')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  console.log('Total records:', count);
  console.log('All records:', JSON.stringify(data, null, 2));

  // Also check auth.users (how many users exist in Supabase Auth)
  console.log('\nNote: The user logged in BEFORE the table existed OR before new code deployed.');
  console.log('They need to sign out and sign back in for the event to fire.');
}

check();
