import { MetadataRoute } from 'next';
import { supabase } from '@/src/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://myflim.com';

  // Fetch all movies
  const { data: movies } = await supabase
    .from('movies')
    .select('id, updated_at')
    .order('created_at', { ascending: false });

  // Fetch all movie lists (categories)
  const { data: movieLists } = await supabase
    .from('movie_lists')
    .select('name');

  const movieEntries: MetadataRoute.Sitemap = (movies || []).map((movie) => ({
    url: `${baseUrl}/movie/${movie.id}`,
    lastModified: movie.updated_at || new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = [
    { name: 'Top Contents' },
    { name: 'Movies' },
    ...(movieLists || [])
  ].map((list) => ({
    url: `${baseUrl}/?list=${encodeURIComponent(list.name)}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/livetv`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/watchlist`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.4,
    },
  ];

  return [...staticEntries, ...categoryEntries, ...movieEntries];
}
