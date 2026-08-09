const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://glqeflybndszpufqvwqf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscWVmbHlibmRzenB1ZnF2d3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzODU2NTUsImV4cCI6MjA1NTk2MTY1NX0.1i5W-O89bA4C-fC-347f_3g5t0j3b3s8g5h8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLogin(username, password) {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'taban_registered_user_accounts')
    .maybeSingle();

  if (!data || !data.value) {
    console.log('No accounts found in DB');
    return;
  }

  const accounts = JSON.parse(data.value);
  console.log('Found total accounts in DB:', accounts.length);
  
  const match = accounts.find(a => a.username.toLowerCase() === username.toLowerCase());

  if (!match) {
    console.log('ACCOUNT NOT FOUND:', username);
    return;
  }

  if (match.password !== password) {
    console.log('PASSWORD MISMATCH for:', username);
    return;
  }

  console.log('LOGIN SUCCESSFUL! User details:', match);
}

testLogin('Taha', '123');
