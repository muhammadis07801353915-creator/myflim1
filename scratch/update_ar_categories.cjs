const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function update() {
  const updates = [
    { id: 1, name: 'News', name_ar: 'الأخبار', name_en: 'News' },
    { id: 2, name: 'Sports', name_ar: 'رياضة', name_en: 'Sports' },
    { id: 3, name: 'Kids', name_ar: 'أطفال', name_en: 'Kids' },
    { id: 13, name: 'Movies', name_ar: 'أفلام', name_en: 'Movies' },
    { id: 14, name: 'Entertainment', name_ar: 'ترفيه', name_en: 'Entertainment' },
  ];

  for (const u of updates) {
    const { data, error } = await supabase
      .from('channel_categories')
      .update({ name_ar: u.name_ar, name_en: u.name_en })
      .eq('id', u.id);
    console.log(`Updated ${u.name}:`, error || 'Success');
  }
}

update();
