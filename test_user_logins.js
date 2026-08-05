import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAndSetup() {
  // Try to insert a test row to see if table exists
  const { data, error } = await supabase
    .from('user_logins')
    .insert([{ source: 'test', email: 'test@test.com' }])
    .select();

  if (error) {
    console.log('Table does NOT exist yet. Error:', error.message);
    console.log('\nYou need to run this SQL in your Supabase Dashboard > SQL Editor:\n');
    console.log(`
CREATE TABLE IF NOT EXISTS public.user_logins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'web_google',
  email TEXT,
  display_name TEXT,
  user_id TEXT,
  device_id TEXT,
  code_used TEXT
);
ALTER TABLE public.user_logins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert for all" ON public.user_logins FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read for all" ON public.user_logins FOR SELECT USING (true);
`);
  } else {
    console.log('Table EXISTS! Test insert succeeded:', data);
    // Clean up test row
    if (data && data[0]) {
      await supabase.from('user_logins').delete().eq('id', data[0].id);
      console.log('Test row deleted.');
    }
    // Check total count
    const { count } = await supabase.from('user_logins').select('*', { count: 'exact', head: true });
    console.log('Total logins recorded:', count);
  }
}

testAndSetup();
