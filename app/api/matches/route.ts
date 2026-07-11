import { type NextRequest } from 'next/server';

const BASE_URL = 'https://streamed.pk';

interface MatchItem {
  id: string;
  title: string;
  category: string;
  date: number;
  sources?: { source: string; id: string }[];
  teams?: {
    home?: { name: string; badge?: string };
    away?: { name: string; badge?: string };
  };
}

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
        next: { revalidate: 10 },
      });
      if (!res.ok) {
        return Response.json({ error: `Upstream error: ${res.status}` }, { status: res.status });
      }
      const data = await res.json();
      return Response.json(data, {
        headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=5' },
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
        next: { revalidate: 10 },
      });
      if (!res.ok) {
        return Response.json({ error: `Upstream error: ${res.status}` }, { status: res.status });
      }
      const data = await res.json();
      return Response.json(data, {
        headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=5' },
      });
    } catch (err) {
      console.error(`[/api/matches] Sport ${sport} fetch failed:`, err);
      return Response.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }
  }

  // 3. Fallback Candidates for All Today's Matches (Self-Healing)
  const mainCandidates = ['/api/matches/all-today', '/api/matches/today'];
  let mainData: unknown[] | null = null;

  for (const cand of mainCandidates) {
    try {
      const res = await fetch(`${BASE_URL}${cand}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        next: { revalidate: 10 },
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          mainData = json;
          break;
        }
      }
    } catch (e) {
      console.error(`Fetch for ${cand} failed:`, e);
    }
  }

  // If the main schedule endpoint succeeded, return it immediately
  if (mainData) {
    return Response.json(mainData, {
      headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=5' },
    });
  }

  // If the main endpoint is blocked (403) or empty, compile from individual sports in parallel!
  const sportsList = [
    'football',
    'basketball',
    'tennis',
    'motor-sports',
    'fight',
    'cricket',
    'rugby',
    'afl',
    'baseball',
    'hockey',
    'american-football',
    'golf',
    'billiards',
    'darts',
    'other'
  ];

  try {
    const fetchPromises = sportsList.map(async (sp) => {
      const url = `${BASE_URL}/api/matches/${sp}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        next: { revalidate: 10 },
      });
      if (res.ok) {
        const json = await res.json();
        return Array.isArray(json) ? json : [];
      }
      return [];
    });

    const results = await Promise.allSettled(fetchPromises);
    const allMatches: MatchItem[] = [];
    const seenIds = new Set<string>();

    for (const r of results) {
      if (r.status === 'fulfilled') {
        for (const m of r.value) {
          if (m && m.id && !seenIds.has(m.id)) {
            seenIds.add(m.id);
            allMatches.push(m);
          }
        }
      }
    }

    // Sort matches by date ascending
    allMatches.sort((a, b) => (Number(a.date) || 0) - (Number(b.date) || 0));

    return Response.json(allMatches, {
      headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=5' },
    });
  } catch (err) {
    console.error('[/api/matches] Compiling sports failed:', err);
    return Response.json({ error: 'Failed to compile matches list' }, { status: 500 });
  }
}
