import { type NextRequest } from 'next/server';

const BASE_URL = 'https://streamed.pk';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sport = searchParams.get('sport') ?? 'all';
  const filter = searchParams.get('filter'); // 'live' | 'today' | null

  // 1. Live filter maps directly to /api/matches/live
  if (filter === 'live') {
    const endpoint = '/api/matches/live';
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
        next: { revalidate: 60 },
      });
      if (!res.ok) {
        return Response.json({ error: `Upstream error: ${res.status}` }, { status: res.status });
      }
      const data = await res.json();
      return Response.json(data, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
      });
    } catch (err) {
      console.error('[/api/matches] Live fetch failed:', err);
      return Response.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }
  }

  // 2. Sport-specific filter maps directly to /api/matches/{sport}
  if (sport && sport !== 'all') {
    const endpoint = `/api/matches/${encodeURIComponent(sport)}`;
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
        next: { revalidate: 60 },
      });
      if (!res.ok) {
        return Response.json({ error: `Upstream error: ${res.status}` }, { status: res.status });
      }
      const data = await res.json();
      return Response.json(data, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
      });
    } catch (err) {
      console.error(`[/api/matches] Sport ${sport} fetch failed:`, err);
      return Response.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }
  }

  // 3. Fallback Candidates for All Today's Matches (Self-Healing)
  const candidates = [
    '/api/matches/today',
    '/api/matches/all-today',
    '/api/matches/all',
    '/api/matches'
  ];

  let lastStatus = 404;
  for (const cand of candidates) {
    try {
      const res = await fetch(`${BASE_URL}${cand}`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        next: { revalidate: 60 },
      });
      if (res.ok) {
        const data = await res.json();
        return Response.json(data, {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
          },
        });
      } else {
        lastStatus = res.status;
      }
    } catch (e) {
      console.error(`Candidate ${cand} failed:`, e);
    }
  }

  return Response.json(
    { error: `Upstream error: all candidates failed. Last status: ${lastStatus}` },
    { status: lastStatus }
  );
}
