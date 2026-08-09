const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function registerTestUser(username, password) {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'taban_registered_user_accounts')
    .maybeSingle();

  let accounts = [];
  if (data && data.value) {
    accounts = JSON.parse(data.value);
  }

  const existing = accounts.find(a => a.username.toLowerCase() === username.toLowerCase());
  if (existing) {
    console.log('User already exists:', username);
    existing.password = password; // Update password
  } else {
    accounts.push({
      id: 'usr_' + username.toLowerCase(),
      username,
      password,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      createdAt: new Date().toISOString()
    });
    console.log('Added new account:', username);
  }

  const { error } = await supabase
    .from('settings')
    .update({ value: JSON.stringify(accounts) })
    .eq('key', 'taban_registered_user_accounts');

  console.log('Saved accounts to Supabase. Error:', error);
}

registerTestUser('Taha', '123');
