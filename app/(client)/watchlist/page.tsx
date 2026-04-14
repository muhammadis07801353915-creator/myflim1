'use client';

import Watchlist from '@/src/components/Watchlist';
import { useRouter } from 'next/navigation';

export default function WatchlistPage() {
  const router = useRouter();

  const handleSelect = (item: any) => {
    router.push(`/movie/${item.id}`);
  };

  return <Watchlist onSelect={handleSelect} />;
}
