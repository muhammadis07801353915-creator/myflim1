const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const initialAccounts = [
    {
      id: 'usr_taha',
      username: 'Taha',
      password: '123', // Sample password or default
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      createdAt: new Date().toISOString()
    }
  ];

  console.log('Inserting taban_registered_user_accounts...');
  const { data, error } = await supabase
    .from('settings')
    .insert([{ key: 'taban_registered_user_accounts', value: JSON.stringify(initialAccounts) }])
    .select();

  console.log('Insert result data:', data, 'error:', error);
}

testInsert();
