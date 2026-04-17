import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';

interface CheckResult {
  id: number;
  title: string;
  url: string;
  isAccessible: boolean;
  reason: string;
}

// -------------------- Individual Checkers --------------------

async function checkGoogleDrive(url: string): Promise<boolean> {
  try {
    // Extract file ID and construct preview URL
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) return false;
    const fileId = match[1];
    const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    const res = await fetch(previewUrl, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function checkOkRu(url: string): Promise<boolean> {
  try {
    // Convert to embed URL and try HEAD
    const embedUrl = url.replace('ok.ru/video/', 'ok.ru/videoembed/');
    const res = await fetch(embedUrl, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
    return res.status < 400;
  } catch {
    return false;
  }
}

async function checkYoutube(url: string): Promise<boolean> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(8000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function checkGenericUrl(url: string): Promise<boolean> {
  try {
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    const res = await fetch(finalUrl, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
    return res.status < 400;
  } catch {
    return false;
  }
}

async function checkUrl(url: string): Promise<{ accessible: boolean; reason: string }> {
  if (!url || url.trim() === '' || url === '[]') {
    return { accessible: false, reason: 'Empty URL' };
  }

  try {
    // Parse JSON arrays (server lists)
    if (url.startsWith('[')) {
      const servers = JSON.parse(url);
      // Check first non-empty server URL
      for (const server of servers) {
        const serverUrl = server.url || server.servers?.[0]?.url;
        if (serverUrl && serverUrl.trim() !== '') {
          const result = await checkSingleUrl(serverUrl);
          return result;
        }
      }
      return { accessible: false, reason: 'No valid URL found in server list' };
    }

    return await checkSingleUrl(url);
  } catch {
    return { accessible: false, reason: 'Invalid URL format' };
  }
}

async function checkSingleUrl(url: string): Promise<{ accessible: boolean; reason: string }> {
  if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
    const ok = await checkGoogleDrive(url);
    return { accessible: ok, reason: ok ? 'OK' : 'Google Drive file not accessible or quota exceeded' };
  }
  if (url.includes('ok.ru')) {
    const ok = await checkOkRu(url);
    return { accessible: ok, reason: ok ? 'OK' : 'OK.ru video not found' };
  }
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const ok = await checkYoutube(url);
    return { accessible: ok, reason: ok ? 'OK' : 'YouTube video unavailable' };
  }
  if (url.includes('t.me') || url.includes('telegram.me')) {
    // Telegram links can't be easily verified server-side, assume OK
    return { accessible: true, reason: 'Telegram (assumed OK)' };
  }
  // Generic check
  const ok = await checkGenericUrl(url);
  return { accessible: ok, reason: ok ? 'OK' : 'URL returned error status' };
}

// -------------------- Main Handler --------------------

export async function GET(req: NextRequest) {
  // Security: verify cron secret or internal call
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'default-cron-secret';
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    // Allow if called from localhost in development
    const host = req.headers.get('host') || '';
    if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Initialize Supabase inside handler (runtime env vars available here)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // Fetch all published movies
    const { data: movies, error } = await supabase
      .from('movies')
      .select('id, title, video_url, is_broken')
      .eq('status', 'Published');

    if (error) throw error;
    if (!movies || movies.length === 0) {
      return NextResponse.json({ message: 'No movies to check', checked: 0 });
    }

    const results: CheckResult[] = [];
    let brokenCount = 0;
    let fixedCount = 0;

    // Check each movie (with concurrency limit of 5)
    const batchSize = 5;
    for (let i = 0; i < movies.length; i += batchSize) {
      const batch = movies.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (movie) => {
        const { accessible, reason } = await checkUrl(movie.video_url || '');
        const shouldBeBroken = !accessible;

        results.push({
          id: movie.id,
          title: movie.title,
          url: movie.video_url || '',
          isAccessible: accessible,
          reason,
        });

        // Only update if status changed
        if (shouldBeBroken !== movie.is_broken) {
          await supabase
            .from('movies')
            .update({ is_broken: shouldBeBroken })
            .eq('id', movie.id);
          
          if (shouldBeBroken) brokenCount++;
          else fixedCount++;
        }
      }));
    }

    return NextResponse.json({
      message: 'Health check complete',
      checked: movies.length,
      newlyBroken: brokenCount,
      newlyFixed: fixedCount,
      results,
    });

  } catch (err: any) {
    console.error('Health check error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
