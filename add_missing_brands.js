import 'dotenv/config';
import { supabase } from './src/lib/supabase.js';

async function updateBrands() {
  const newBrands = [
    { name: 'BYD', image_url: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/BYD_logo.svg' },
    { name: 'Geely', image_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Geely_logo.svg/1200px-Geely_logo.svg.png' },
    { name: 'Haval', image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Haval_logo.svg/1200px-Haval_logo.svg.png' }
  ];

  for (const b of newBrands) {
    const { data: existing } = await supabase.from('brands').select('*').eq('name', b.name).single();
    if (!existing) {
      console.log(`Inserting brand: ${b.name}`);
      const { data, error } = await supabase.from('brands').insert([b]).select();
      if (error) console.error('Error inserting', b.name, error);
      else console.log('Inserted', data);
    } else {
      console.log(`Brand ${b.name} already exists.`);
    }
  }

  // Update order logic? Wait, we can't easily add sort_order column if it doesn't exist without admin privileges maybe?
  // Let's just fetch all brands to see them.
  const { data: allBrands } = await supabase.from('brands').select('name');
  console.log('All brands:', allBrands.map(b => b.name).join(', '));
}

updateBrands();
