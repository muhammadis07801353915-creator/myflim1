import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkDatabaseState() {
  const { data, count, error } = await supabase
    .from('movies')
    .select('id, title, video_url, is_broken', { count: 'exact' })
    .eq('is_broken', true);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total movies marked as broken: ${count}`);
  console.log('Sample of broken items:');
  data?.slice(0, 10).forEach(m => {
    console.log(`- [${m.id}] ${m.title} | URL: ${m.video_url}`);
  });
}

checkDatabaseState();
