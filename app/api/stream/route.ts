import { type NextRequest } from 'next/server';

const BASE_URL = 'https://streamed.pk';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const source = searchParams.get('source');
  const id = searchParams.get('id');

  if (!source || !id) {
    return Response.json(
      { error: 'Missing required params: source, id' },
      { status: 400 }
    );
  }

  // Sanitize inputs — allow only alphanumeric, dash, underscore
  if (!/^[\w-]+$/.test(source) || !/^[\w-]+$/.test(id)) {
    return Response.json({ error: 'Invalid params' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${BASE_URL}/api/stream/${encodeURIComponent(source)}/${encodeURIComponent(id)}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FLStreams/1.0)' },
        next: { revalidate: 30 },
      }
    );

    if (!res.ok) {
      return Response.json(
        { error: `Upstream error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=10',
      },
    });
  } catch (err) {
    console.error('[/api/stream]', err);
    return Response.json({ error: 'Failed to fetch stream' }, { status: 500 });
  }
}
