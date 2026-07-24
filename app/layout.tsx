import type { Metadata, Viewport } from 'next';
import Providers from './providers';
import { fetchAllData } from '@/src/lib/fetchData';
import '@/src/index.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'MBox | باشترین سەرچاوە بۆ بینینی فیلم و زنجیرەکان',
  description: 'سەکۆی MBox بۆ بینینی نوێترین فیلم و زنجیرە جیهانییەکان بە ژێرنووسی کوردی و کوالێتی بەرز.',
  manifest: '/manifest.json',
  verification: {
    google: 'iVzP8mGF3Lc9mJu2-r-jkshlTCXfklCgzMwEzP1ISvk',
  },
  openGraph: {
    title: 'MBox - بینەری نوێترین فیلم و زنجیرەکان بن',
    description: 'نوێترین فیلم و زنجیرەکان بە زمانی کوردی، عەرەبی و ئینگلیزی لێرە ببینە',
    type: 'website',
    url: 'https://myflim.com',
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  themeColor: '#0f1115',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialData = await fetchAllData();

  return (
    <html lang="en">
      <body>
        <Providers initialData={initialData}>
          <div id="root">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
