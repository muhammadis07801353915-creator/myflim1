import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
  },
});

export async function fetchAllRows(client: any, table: string, orderColumn: string) {
  let allData: any[] = [];
  let from = 0;
  const step = 1000;
  
  while (true) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .order(orderColumn, { ascending: false })
      .range(from, from + step - 1);
      
    if (error) {
      console.error(`Error fetching ${table}:`, error);
      break;
    }
    
    if (data && data.length > 0) {
      allData = [...allData, ...data];
      if (data.length < step) {
        break; // reached the end
      }
      from += step;
    } else {
      break;
    }
  }
  
  return allData;
}
