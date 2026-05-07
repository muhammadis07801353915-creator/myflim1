
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function bringToFront() {
  console.log('--- Bringing specific movies to front ---');
  
  const searchTerms = ['کچە زەنگین', 'هەیبە', 'کچە دەوڵەمەند']; // Trying variations
  
  for (const term of searchTerms) {
    const { data: found } = await supabase
      .from('movies')
      .select('id, title')
      .ilike('title', `%${term}%`);
    
    if (found && found.length > 0) {
      for (const m of found) {
        console.log(`Bringing ${m.title} to front...`);
        await supabase.from('movies').update({ created_at: new Date().toISOString() }).eq('id', m.id);
      }
    }
  }
  
  // Also bring some cartoons to front
  const { data: cartoons } = await supabase
    .from('movies')
    .select('id, title')
    .eq('list_name', 'کارتۆن و ئەنیمەی کوردی')
    .limit(20);
    
  if (cartoons) {
    for (const c of cartoons) {
      await supabase.from('movies').update({ created_at: new Date().toISOString() }).eq('id', c.id);
    }
  }
  
  console.log('Done! Now they should appear at the very top of the list.');
}

bringToFront();
