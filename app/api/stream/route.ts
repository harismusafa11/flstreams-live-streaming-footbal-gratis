import type { NextRequest } from 'next/server';
import type { StreamFreeStream } from '@/lib/types';

const BASE_URL = 'https://streamfree.top';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const streamKey = searchParams.get('id');
  const category = searchParams.get('source'); // source param carries the SF category

  if (!streamKey) {
    return Response.json(
      { error: 'Missing required param: id (stream_key)' },
      { status: 400 }
    );
  }

  // Sanitize — allow only alphanumeric, dash, underscore
  if (!/^[\w-]+$/.test(streamKey)) {
    return Response.json({ error: 'Invalid params' }, { status: 400 });
  }

  try {
    // Try fetching specific stream by key first
    const res = await fetch(
      `${BASE_URL}/api/v1/streams/${encodeURIComponent(streamKey)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FLStreams/2.0)',
          Accept: 'application/json',
          Referer: 'https://streamfree.top/',
        },
        next: { revalidate: 30 },
      }
    );

    if (!res.ok) {
      // If not found by key, try fetching from category list
      if (res.status === 404 && category) {
        const catRes = await fetch(
          `${BASE_URL}/api/v1/streams?category=${encodeURIComponent(category)}`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; FLStreams/2.0)',
              Accept: 'application/json',
              Referer: 'https://streamfree.top/',
            },
            next: { revalidate: 30 },
          }
        );
        if (catRes.ok) {
          const data = await catRes.json();
          const found = (data.streams ?? []).find(
            (s: StreamFreeStream) => s.stream_key === streamKey
          );
          if (found) {
            // Return as array with single stream (compatible with existing WatchClient)
            return Response.json([found], {
              headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=10' },
            });
          }
        }
      }
      return Response.json(
        { error: `Stream not found: ${res.status}` },
        { status: res.status }
      );
    }

    const stream: StreamFreeStream = await res.json();

    // Return as array for compatibility with existing WatchClient code
    return Response.json([stream], {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=10',
      },
    });
  } catch (err) {
    console.error('[/api/stream]', err);
    return Response.json({ error: 'Failed to fetch stream' }, { status: 500 });
  }
}
