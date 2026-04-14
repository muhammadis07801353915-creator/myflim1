'use client';

import { LanguageProvider } from '@/src/lib/LanguageContext';
import { DataProvider } from '@/src/lib/DataContext';

interface ProvidersProps {
  children: React.ReactNode;
  initialData?: {
    movies: any[];
    movieLists: any[];
    channels: any[];
    categories: any[];
    banners: any[];
  };
}

export default function Providers({ children, initialData }: ProvidersProps) {
  return (
    <LanguageProvider>
      <DataProvider initialData={initialData}>
        {children}
      </DataProvider>
    </LanguageProvider>
  );
}
