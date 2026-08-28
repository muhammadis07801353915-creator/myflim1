const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from('app_updates').insert([
    {
      platform: 'android',
      version: '1.0.4',
      build_version: '10',
      apk_url: 'https://expo.dev/artifacts/eas/goG28K4qRrsSLZO5v3hEmVzb4M8fnQH1OnFUX28_YNg.apk',
      release_notes: 'Updated password visibility, theme banner fix, Taban1 restricted mode, and 4-language translations.',
      mandatory: false
    }
  ]);
  if (error) console.error('Insert error:', error);
  else console.log('Successfully inserted app_update 1.0.4 into Supabase!');
}

run();
