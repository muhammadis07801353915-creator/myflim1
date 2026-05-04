import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();
    
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Items must be an array' }, { status: 400 });
    }

    const results = await Promise.all(items.map(async (item: any) => {
      const { tmdbId, type, season, episode } = item;
      const url = type === 'tv' 
        ? `https://vidsrc.pm/embed/tv/${tmdbId}/${season || 1}/${episode || 1}`
        : `https://vidsrc.pm/embed/movie/${tmdbId}`;

      try {
        // Use a real User-Agent to avoid simple blocks
        const resp = await fetch(url, { 
          method: 'GET', // HEAD might be blocked or return 200 for error pages
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          signal: AbortSignal.timeout(5000) 
        });

        // Some embed sites return 200 but the body contains "not found"
        // vidsrc.pm redirects to its homepage if the content is not found
        if (resp.status === 404) {
          return { tmdbId, valid: false, reason: '404 Not Found' };
        }

        const finalUrl = resp.url.split('?')[0].replace(/\/$/, '');
        if (finalUrl === 'https://vidsrc.pm' || finalUrl === 'https://vidsrc.me' || finalUrl === 'https://vidsrc.to') {
          return { tmdbId, valid: false, reason: 'Redirected to homepage (Content not found)' };
        }

        return { tmdbId, valid: resp.ok, reason: resp.ok ? 'OK' : `Status ${resp.status}` };
      } catch (err: any) {
        return { tmdbId, valid: false, reason: err.message || 'Timeout' };
      }
    }));

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
