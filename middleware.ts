import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

// Configuration
const ADMIN_ROUTE = '/portal-control-center';
const WHITELISTED_IPS = process.env.WHITELISTED_IPS?.split(',') || []; // e.g. "1.2.3.4,5.6.7.8"

// In-memory rate limiting (Note: Reset on every serverless function cold start)
// For Hobby plan without Redis, this is a basic "per-instance" limit.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 50; // Max 50 requests per minute

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  
  // 1. Admin Panel Protection
  if (pathname.startsWith(ADMIN_ROUTE)) {
    // Check IP Whitelist if configured
    if (WHITELISTED_IPS.length > 0 && !WHITELISTED_IPS.includes(clientIP)) {
      console.warn(`Blocked unauthorized access to admin from IP: ${clientIP}`);
      return new NextResponse('Access Denied', { status: 403 });
    }
    
    // Additional: Redirect /admin to 404 to hide its existence
    // (Handled by the fact we moved the folder, but good to keep in mind)
  }

  // 2. Rate Limiting for API routes
  if (pathname.startsWith('/api/')) {
    // Determine Identifier (User ID or IP/Session)
    // Here we use IP for simplicity in middleware, but User ID is better if logged in.
    // Since we don't have the user object here easily without a Supabase session check (which adds latency), 
    // we use a combination of IP + Path.
    const identifier = clientIP; 
    const now = Date.now();
    const rateInfo = rateLimitMap.get(identifier) || { count: 0, lastReset: now };

    if (now - rateInfo.lastReset > LIMIT_WINDOW) {
      rateInfo.count = 1;
      rateInfo.lastReset = now;
    } else {
      rateInfo.count++;
    }

    rateLimitMap.set(identifier, rateInfo);

    if (rateInfo.count > MAX_REQUESTS) {
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: { 'Retry-After': '60' }
      });
    }
  }

  // 3. Security Headers (redundant with next.config.ts but good for edge)
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/api/:path*', '/portal-control-center/:path*'],
};
