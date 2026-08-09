const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectListNames() {
  const { data: movies, error } = await supabase.from('movies').select('id, title, list_name');
  if (error) {
    console.error('Error fetching movies:', error);
    return;
  }
  
  const listCounts = {};
  const listMovies = {};
  movies.forEach(m => {
    const raw = m.list_name || 'NULL';
    listCounts[raw] = (listCounts[raw] || 0) + 1;
    if (!listMovies[raw]) listMovies[raw] = [];
    listMovies[raw].push({ id: m.id, title: m.title });
  });

  console.log('--- DISTINCT LIST NAMES AND COUNTS ---');
  console.log(JSON.stringify(listCounts, null, 2));

  // Let's check for any list containing 'ئەنیمەیشن' or 'کارتۆن'
  console.log('\n--- LISTS CONTAINING ANIMATION / CARTOON ---');
  Object.keys(listCounts).forEach(key => {
    if (key.includes('ئەنیمەیشن') || key.includes('کارتۆن') || key.includes('Animation') || key.includes('Cartoon')) {
      console.log(`List "${key}": ${listCounts[key]} items`);
      console.log('Sample items:', listMovies[key].slice(0, 5));
    }
  });
}

inspectListNames();
