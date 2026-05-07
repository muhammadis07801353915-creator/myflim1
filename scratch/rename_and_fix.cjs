
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function renameAndFix() {
  console.log('--- Renaming list to force visibility ---');
  
  // 1. Create a new list entry just in case
  const { data: maxId } = await supabase.from('movie_lists').select('id').order('id', { ascending: false }).limit(1);
  const nextId = (maxId?.[0]?.id || 0) + 1;
  
  await supabase.from('movie_lists').insert([{
    id: nextId,
    name: 'کارتۆنی نوێ',
    order_index: -100
  }]);

  // 2. Update movies to use this new list name
  const { error } = await supabase
    .from('movies')
    .update({ list_name: 'کارتۆنی نوێ' })
    .eq('list_name', 'کارتۆن و ئەنیمەی کوردی');
    
  if (error) console.error(error);
  else console.log('Successfully moved movies to "کارتۆنی نوێ"');
}

renameAndFix();
