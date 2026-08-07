import type { Metadata, Viewport } from 'next';
import Providers from './providers';
import { fetchAllData } from '@/src/lib/fetchData';
import '@/src/index.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Taban Play | باشترین سەرچاوە بۆ بینینی فیلم و زنجیرەکان',
  description: 'سەکۆی Taban Play بۆ بینینی نوێترین فیلم و زنجیرە جیهانییەکان بە ژێرنووسی کوردی و کوالێتی بەرز.',
  manifest: '/manifest.json',
  verification: {
    google: 'iVzP8mGF3Lc9mJu2-r-jkshlTCXfklCgzMwEzP1ISvk',
  },
  openGraph: {
    title: 'Taban Play - بینەری نوێترین فیلم و زنجیرەکان بن',
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
    <html lang="ku" dir="rtl" className="rtl">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('myfilm_theme');
                  if (theme === 'light') {
                    document.documentElement.classList.add('light-mode');
                  } else if (theme === 'dark') {
                    document.documentElement.classList.remove('light-mode');
                  }
                  var lang = localStorage.getItem('app_language') || localStorage.getItem('myfilm_language') || 'ku';
                  document.documentElement.setAttribute('lang', lang);
                  if (lang === 'ku' || lang === 'ar') {
                    document.documentElement.setAttribute('dir', 'rtl');
                    document.documentElement.classList.add('rtl');
                  } else {
                    document.documentElement.setAttribute('dir', 'ltr');
                    document.documentElement.classList.remove('rtl');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <Providers initialData={initialData}>
          <div id="root">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
