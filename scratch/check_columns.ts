import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking movies table columns...");
    const { data, error } = await supabase.from('movies').select('*').limit(1);
    if (error) {
        console.error("Error fetching movies:", error);
    } else if (data && data.length > 0) {
        console.log("Columns in movies:", Object.keys(data[0]));
    } else {
        console.log("No data in movies table to check columns.");
    }

    console.log("\nChecking channels table columns...");
    const { data: chanData, error: chanError } = await supabase.from('channels').select('*').limit(1);
    if (chanError) {
        console.error("Error fetching channels:", chanError);
    } else if (chanData && chanData.length > 0) {
        console.log("Columns in channels:", Object.keys(chanData[0]));
    } else {
        console.log("No data in channels table to check columns.");
    }
}
check();
