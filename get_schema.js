import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase.rpc('get_schema_info', { table_name: 'messages' });
  console.log("MESSAGES:", data || error);
  
  const { data: d2 } = await supabase.from('messages').select('*').limit(1);
  console.log("MESSAGES ROW:", d2);
  
  const { data: d3 } = await supabase.from('profiles').select('*').limit(1);
  console.log("PROFILES ROW:", d3);
  
  const { data: d4 } = await supabase.from('showrooms').select('*').limit(1);
  console.log("SHOWROOMS ROW:", d4);
}
check();
