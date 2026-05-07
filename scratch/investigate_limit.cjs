
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function forceToTop() {
  console.log('--- Forcing movies to top of ID list ---');
  
  // Find movies that are currently in the bottom 205 (the ones missing from top 1000)
  const { data: allMovies } = await supabase
    .from('movies')
    .select('id, title, list_name')
    .order('id', { ascending: false });
    
  if (!allMovies) return;
  
  const orphanedOrMissing = allMovies.slice(1000); // Items beyond the first 1000
  console.log(`Found ${orphanedOrMissing.length} items currently hidden by the 1000 limit.`);
  
  // For these items, we want to make them visible. 
  // Instead of changing ID (risky), I will change the ORDER in Movies.tsx to created_at
  // But wait, the user is looking at the current site.
  
  // Let's try to update their list_name to something else and back? No.
  
  // WAIT! I know what to do. I will update the code to NOT use a limit for now 
  // or use a very large one in the query. 
  // Oh wait, I already did that and pushed it.
  
  // If the user still sees "1000 of 1000", the deployment is definitely STUCK.
}

forceToTop();
