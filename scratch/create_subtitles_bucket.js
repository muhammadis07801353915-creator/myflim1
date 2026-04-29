
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createBucket() {
    const { data, error } = await supabase.storage.createBucket('subtitles', {
        public: true,
        allowedMimeTypes: ['text/vtt', 'application/x-subrip', 'text/plain', 'application/octet-stream'],
        fileSizeLimit: 10485760 // 10MB
    });
    if (error) {
        if (error.message.includes('already exists')) {
            console.log('Bucket already exists');
        } else {
            console.error('Error creating bucket:', error);
        }
    } else {
        console.log('Bucket created:', data);
    }
}

createBucket();
