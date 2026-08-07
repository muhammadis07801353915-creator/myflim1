import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPublicUpdatePermission() {
  // Test SELECT first
  const { data: readData, error: readErr } = await supabase.from('settings').select('*').eq('key', 'taban_live_support_chats');
  console.log('Read data:', readData, 'Read err:', readErr);

  // Test UPDATE with returning data to see if RLS blocked the update!
  const sampleText = JSON.stringify([
    { id: '1', user_id: 'Hamais1', user_name: 'Hamais1', message: 'slaw from script', sender: 'user', created_at: new Date().toISOString() }
  ]);

  const { data: upData, error: upErr, count } = await supabase
    .from('settings')
    .update({ value: sampleText })
    .eq('key', 'taban_live_support_chats')
    .select();

  console.log('Update return data:', upData);
  console.log('Update error:', upErr);
}

testPublicUpdatePermission();
