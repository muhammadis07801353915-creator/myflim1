const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('--- Testing watch_party_invites query ---');
  const { data, error } = await supabase.from('settings').select('*').eq('key', 'watch_party_invites').maybeSingle();
  console.log('Select result:', { data, error });

  // Check registered accounts list
  const { data: accsData, error: accsErr } = await supabase.from('settings').select('value').eq('key', 'taban_registered_user_accounts').maybeSingle();
  console.log('Registered accounts count:', accsData?.value ? JSON.parse(accsData.value).length : 0);
  if (accsData?.value) {
    const list = JSON.parse(accsData.value);
    console.log('Sample registered usernames:', list.slice(0, 10).map(a => a.username));
  }
}

run();
