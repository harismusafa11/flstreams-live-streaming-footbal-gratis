import type { NextRequest } from 'next/server';
import type { StreamFreeStreamsResponse, StreamFreeStream, Match } from '@/lib/types';

const BASE_URL = 'https://streamfree.top';

/** Map StreamFree category names → local app slugs */
const CATEGORY_MAP: Record<string, string> = {
  soccer: 'football',
  football: 'football',
  basketball: 'basketball',
  tennis: 'tennis',
  baseball: 'baseball',
  hockey: 'hockey',
  combat: 'boxing',
  cricket: 'cricket',
  racing: 'motorsport',
};

/** Map app slugs → StreamFree category param */
const SLUG_TO_SF: Record<string, string> = {
  football: 'soccer',
  basketball: 'basketball',
  tennis: 'tennis',
  boxing: 'combat',
  motorsport: 'racing',
  cricket: 'cricket',
  baseball: 'baseball',
  hockey: 'hockey',
};

/** Convert a StreamFree stream object into our internal Match format */
function toMatch(s: StreamFreeStream): Match {
  // Prefer team1/team2 from API (has ESPN logos), fallback to name parsing
  let teams: Match['teams'] | undefined;

  if (s.team1 && s.team2) {
    teams = {
      home: { name: s.team1.name, logo: s.team1.logo },
      away: { name: s.team2.name, logo: s.team2.logo },
    };
  } else {
    // Parse from name if contains " vs "
    const vsIdx = s.name.toLowerCase().indexOf(' vs ');
    if (vsIdx !== -1) {
      teams = {
        home: { name: s.name.slice(0, vsIdx).trim() },
        away: { name: s.name.slice(vsIdx + 4).trim() },
      };
    }
  }

  return {
    id: s.stream_key,
    title: s.name,
    category: CATEGORY_MAP[s.category] ?? s.category,
    date: s.match_timestamp,
    poster: s.thumbnail_url,
    embedUrl: s.embed_url,
    league: s.league,
    viewers: s.viewers,
    teams,
    sources: [
      {
        source: s.category, // original StreamFree category (e.g. "soccer")
        id: s.stream_key,
      },
    ],
  };
}


export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sport = searchParams.get('sport') ?? 'all';

  // Map the sport slug to StreamFree category
  const sfCategory = sport !== 'all' ? (SLUG_TO_SF[sport] ?? sport) : null;

  // Build the StreamFree API URL
  const url = sfCategory
    ? `${BASE_URL}/api/v1/streams?category=${encodeURIComponent(sfCategory)}`
    : `${BASE_URL}/api/v1/streams`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
        Referer: 'https://streamfree.top/',
      },
      next: { revalidate: 30 }, // cache 30s — live data changes often
    });

    if (!res.ok) {
      return Response.json({ error: `Upstream error: ${res.status}` }, { status: res.status });
    }

    const data: StreamFreeStreamsResponse = await res.json();
    const matches: Match[] = (data.streams ?? []).map(toMatch);


    return Response.json(matches, {
      headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=10' },
    });

  } catch (err) {
    console.error('[/api/matches]', err);
    return Response.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}
