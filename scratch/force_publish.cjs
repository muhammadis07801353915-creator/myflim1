
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function forcePublish() {
  console.log('--- Forcing Publish for Missing Lists ---');
  
  const targetLists = [
    'فیلمی کوردی دۆبلاژ',
    'زنجیرەی کوردی دۆبلاژ',
    'کارتۆن و ئەنیمەی کوردی'
  ];

  for (const listName of targetLists) {
    console.log(`Updating items in: ${listName}`);
    const { data, error } = await supabase
      .from('movies')
      .update({ status: 'Published' })
      .eq('list_name', listName);
    
    if (error) {
      console.error(`Error updating ${listName}:`, error.message);
    } else {
      console.log(`Successfully updated items in ${listName}`);
    }
  }
}

forcePublish();
