import { Metadata, ResolvingMetadata } from 'next';
import { supabase } from '@/src/lib/supabase';
import MovieDetailPageClient from '@/src/components/MovieDetailPageClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;

  const { data: movie } = await supabase
    .from('movies')
    .select('*')
    .eq('id', id)
    .single();

  if (!movie) {
    return {
      title: 'فیلم دەست نەکەوت | MyFlim',
    };
  }

  const title = `${movie.title || ''} ${movie.title_ar ? `| ${movie.title_ar}` : ''} ${movie.title_en ? `| ${movie.title_en}` : ''}`.trim();
  const description = movie.description || movie.description_ar || movie.description_en || 'بینەری ئەم فیلمە بن لە MyFlim';
  const imageUrl = movie.image || movie.backdrop || '';

  return {
    title: `${title} - MyFlim`,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [imageUrl],
      type: 'video.movie',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [imageUrl],
    },
  };
}

export default async function MovieDetailPage({ params }: Props) {
  const { id } = await params;
  
  return <MovieDetailPageClient id={id} />;
}
