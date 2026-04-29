
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tableName = process.argv[2] || 'movies';

async function checkColumns() {
    console.log(`Checking columns for table: ${tableName}`);
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    if (error) {
        console.error(error);
    } else {
        console.log('Columns:', Object.keys(data[0] || {}));
    }
}

checkColumns();
