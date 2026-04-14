'use client';

import Search from '@/src/components/Search';
import { useRouter } from 'next/navigation';

export default function SearchPage() {
  const router = useRouter();

  const handleSelect = (item: any) => {
    router.push(`/movie/${item.id}`);
  };

  return <Search onSelect={handleSelect} />;
}
