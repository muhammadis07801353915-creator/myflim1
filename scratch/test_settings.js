
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    console.log("Testing 'settings' table...");
    const { data, error } = await supabase.from('settings').select('*');
    if (error) {
        console.error("Error fetching settings:", error);
    } else {
        console.log("Settings data:", data);
        if (data.length > 0) {
            console.log("Columns:", Object.keys(data[0]));
        } else {
            console.log("Table is empty. Trying to insert test row...");
            const { error: insError } = await supabase.from('settings').insert([{ key: 'test', value: 'test' }]);
            if (insError) {
                console.error("Insert failed:", insError);
                // Try different schema
                const { error: insError2 } = await supabase.from('settings').insert([{ name: 'test', value: 'test' }]);
                if (insError2) console.error("Insert failed again:", insError2);
            } else {
                console.log("Insert successful! Schema is {key, value}");
            }
        }
    }
}

test();
