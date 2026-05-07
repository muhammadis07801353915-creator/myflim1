
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function prioritizeLists() {
  console.log('--- Prioritizing Kurdish Lists ---');
  
  // Set very low order_index to bring them to the top
  await supabase.from('movie_lists').update({ order_index: -10 }).eq('name', 'فیلمی کوردی دۆبلاژ');
  await supabase.from('movie_lists').update({ order_index: -9 }).eq('name', 'زنجیرەی کوردی دۆبلاژ');
  await supabase.from('movie_lists').update({ order_index: -8 }).eq('name', 'کارتۆن و ئەنیمەی کوردی');
  
  console.log('Lists prioritized!');
}

prioritizeLists();
