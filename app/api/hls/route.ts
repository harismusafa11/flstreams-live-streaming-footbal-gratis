/**
 * GET /api/hls?url=…&embed=…&embedOrigin=…[&referer=…]
 *
 * HLS relay:
 *  - Pulls upstream URL via curl with correct Referer/Origin headers
 *  - If M3U8 playlist: rewrites all URLs back through this relay
 *  - If TS segment: strips PNG wrapper (tiktokcdn), returns video/mp2t
 *
 * Required by browser hls.js player since CDN (strmd.st / tiktokcdn)
 * blocks direct requests without the embed.st Referer.
 */
import { type NextRequest } from 'next/server';
import { serveHls, parseRelaySlot } from '@/lib/relay/m3u8';

export const runtime = 'nodejs'; // needs child_process for curl

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const url = params.get('url');

  if (!url) {
    return new Response('url param required', { status: 400 });
  }

  // Validate URL is http/https
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return new Response('invalid url protocol', { status: 400 });
    }
  } catch {
    return new Response('invalid url', { status: 400 });
  }

  let slot: ReturnType<typeof parseRelaySlot>;
  try {
    slot = parseRelaySlot(params);
  } catch (err) {
    return new Response(String((err as Error).message), { status: 400 });
  }

  const serverOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  try {
    const { contentType, body } = await serveHls(url, slot, serverOrigin);
    return new Response(body as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('[/api/hls]', err);
    return new Response(`relay error: ${(err as Error).message}`, { status: 502 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
