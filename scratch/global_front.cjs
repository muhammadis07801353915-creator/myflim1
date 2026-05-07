
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function globalBringToFront() {
  console.log('--- Bringing all Kurdish lists to front ---');
  
  const targetLists = [
    'فیلمی کوردی دۆبلاژ',
    'زنجیرەی کوردی دۆبلاژ',
    'کارتۆن و ئەنیمەی کوردی',
    'کارتۆنی نوێ'
  ];

  const now = new Date().toISOString();
  
  for (const listName of targetLists) {
    console.log(`Updating ${listName}...`);
    const { error } = await supabase
      .from('movies')
      .update({ created_at: now })
      .eq('list_name', listName);
      
    if (error) console.error(error);
  }
  
  console.log('All Kurdish movies brought to front!');
}

globalBringToFront();
