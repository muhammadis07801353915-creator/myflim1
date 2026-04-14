'use client';

import { useData } from '@/src/lib/DataContext';
import Detail from '@/src/components/Detail';
import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';

export default function MovieDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { movies, loading } = useData();

  const movie = useMemo(() => {
    return movies.find(m => m.id.toString() === id);
  }, [movies, id]);

  if (loading) return null; // Let the layout handle the loading state

  if (!movie) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <p className="text-neutral-500">ماتڵب دەست نەکەوت</p>
        <button 
          onClick={() => router.push('/')}
          className="px-6 py-2 bg-red-600 rounded-full font-bold"
        >
          گەڕانەوە بۆ سەرەتا
        </button>
      </div>
    );
  }

  return <Detail item={movie} onBack={() => router.back()} />;
}
