import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ojtnsvbofjfqabfdbigx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdG5zdmJvZmpmcWFiZmRiaWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODU4MTQsImV4cCI6MjA5MTA2MTgxNH0.sa1ZqHiD7VPgHYRcJeI-7YD01C54HqESaUtHhxLyRoE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  console.log('Testing channel insert...');
  const { data: channelData, error: channelError } = await supabase.from('channels').insert([{
    name: 'Test Channel',
    category: 'News',
    status: 'Active',
    stream_url: 'http://test.com/stream.m3u8',
    image: ''
  }]).select();
  console.log('Channel Insert Result:', channelData);
  console.log('Channel Insert Error:', channelError);

  console.log('Testing movie insert...');
  const { data: movieData, error: movieError } = await supabase.from('movies').insert([{
    title: 'Test Movie',
    type: 'Movie',
    genre: 'Action',
    year: 2024,
    description: 'Test',
    rating: 5,
    image: '',
    backdrop: '',
    video_url: 'http://test.com/video.mp4'
  }]).select();
  console.log('Movie Insert Result:', movieData);
  console.log('Movie Insert Error:', movieError);
}

testInsert();
