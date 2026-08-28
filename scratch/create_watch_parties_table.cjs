const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkOrInsert() {
  try {
    const { data, error } = await supabase.from('settings').select('*').eq('key', 'watch_party_invites').maybeSingle();
    if (!data) {
      await supabase.from('settings').insert([{ key: 'watch_party_invites', value: JSON.stringify([]) }]);
      console.log('Created watch_party_invites settings key');
    } else {
      console.log('watch_party_invites key ready');
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

checkOrInsert();
