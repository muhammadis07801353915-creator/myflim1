import type { Metadata, Viewport } from 'next';
import Providers from './providers';
import { fetchAllData } from '@/src/lib/fetchData';
import { Inter } from 'next/font/google';
import '@/src/index.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'myTV+',
  manifest: '/manifest.json',
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
    <html lang="en" className={inter.className}>
      <body>
        <Providers initialData={initialData}>
          <div id="root">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
