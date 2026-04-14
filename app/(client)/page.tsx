'use client';

import Home from '@/src/components/Home';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handleSelect = (item: any) => {
    router.push(`/movie/${item.id}`);
  };

  return <Home onSelect={handleSelect} />;
}
