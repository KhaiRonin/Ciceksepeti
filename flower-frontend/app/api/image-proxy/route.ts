import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'example.com'];

function getAllowedHosts(): Set<string> {
  const extra = (process.env.IMAGE_PROXY_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_HOSTS, ...extra]);
}

function placeholderSvg(message = 'Gorsel Yok') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="#f3f4f6"/><text x="40" y="42" text-anchor="middle" font-size="10" fill="#9ca3af" font-family="Arial, sans-serif">${message}</text></svg>`;
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get('url');
  if (!target) {
    return new NextResponse('Missing url', { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new NextResponse(placeholderSvg('Gecersiz URL'), {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' },
    });
  }

  // Keep this endpoint limited to configured hosts for safety.
  const allowedHosts = getAllowedHosts();
  if (!allowedHosts.has(parsed.hostname)) {
    return new NextResponse(placeholderSvg('Host Engelli'), {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' },
    });
  }

  if (!(parsed.protocol === 'http:' || parsed.protocol === 'https:')) {
    return new NextResponse(placeholderSvg('Protokol Hatasi'), {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' },
    });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      cache: 'no-store',
      headers: {
        Accept: 'image/*,*/*;q=0.8',
      },
    });

    if (!upstream.ok) {
      return new NextResponse(placeholderSvg('Gorsel Bulunamadi'), {
        status: 200,
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' },
      });
    }

    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new NextResponse(placeholderSvg('Proxy Hatasi'), {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' },
    });
  }
}
