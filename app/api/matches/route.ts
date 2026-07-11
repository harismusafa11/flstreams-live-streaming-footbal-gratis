import { type NextRequest } from 'next/server';

const BASE_URL = 'https://streamed.pk';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sport = searchParams.get('sport') ?? 'all';
  const filter = searchParams.get('filter'); // 'live' | 'today' | null

  let endpoint: string;
  if (filter === 'live') {
    endpoint = '/api/matches/live';
  } else if (sport && sport !== 'all') {
    endpoint = `/api/matches/${encodeURIComponent(sport)}`;
  } else {
    endpoint = '/api/matches';
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FLStreams/1.0)' },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return Response.json(
        { error: `Upstream error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (err) {
    console.error('[/api/matches]', err);
    return Response.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}
