import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PopunderAd from '@/components/PopunderAd';
import WatchClient from './WatchClient';

interface MatchItem {
  id: string;
  title: string;
  category: string;
  date: number;
  teams?: {
    home?: { name: string; badge?: string };
    away?: { name: string; badge?: string };
  };
  sources?: { source: string; id: string }[];
}

// Fetch match details server-side
async function getMatchDetails(sourceParam: string, idParam: string): Promise<MatchItem | null> {
  try {
    const res = await fetch('https://streamed.pk/api/matches', {
      next: { revalidate: 60 },
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    const matches: MatchItem[] = await res.json();
    if (!Array.isArray(matches)) return null;

    // Find match with this source and id
    return (
      matches.find((m) =>
        m.sources?.some((s) => s.source === sourceParam && s.id === idParam)
      ) || null
    );
  } catch (e) {
    console.error('[getMatchDetails]', e);
    return null;
  }
}

// Convert id slug to clean title fallback (e.g. 'real-madrid-vs-barcelona' -> 'Real Madrid Vs Barcelona')
function formatFallbackTitle(id: string): string {
  return id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ── Dynamic Metadata ──────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ source: string; id: string }>;
}): Promise<Metadata> {
  const { source, id } = await params;
  const match = await getMatchDetails(source, id);

  const cleanTitle = match?.title || formatFallbackTitle(id);
  const sportLabel = match?.category ? ` - Streaming ${match.category}` : '';

  return {
    title: `Nonton Live Streaming ${cleanTitle} Gratis${sportLabel} - FL Streams`,
    description: `Saksikan siaran langsung ${cleanTitle} hari ini secara gratis. Link streaming HD lancar tanpa buffering, tersedia server alternatif terbaik di FL Streams.`,
    keywords: [
      `live streaming ${cleanTitle}`,
      `nonton ${cleanTitle} gratis`,
      `streaming ${cleanTitle} online`,
      `siaran langsung ${cleanTitle}`,
      'FL Streams',
      'nonton bola gratis',
      match?.category || 'sports',
    ],
    openGraph: {
      title: `Live Streaming ${cleanTitle} Gratis - FL Streams`,
      description: `Saksikan siaran langsung ${cleanTitle} hari ini secara gratis dengan kualitas HD di FL Streams.`,
      type: 'video.other',
      url: `https://www.flstreams.my.id/watch/${source}/${id}`,
    },
    twitter: {
      title: `Live Streaming ${cleanTitle} Gratis - FL Streams`,
      description: `Saksikan siaran langsung ${cleanTitle} hari ini secara gratis dengan kualitas HD di FL Streams.`,
    },
  };
}

// ── JSON-LD SportsEvent Schema ─
function SportsEventSchema({
  match,
  source,
  id,
}: {
  match: MatchItem | null;
  source: string;
  id: string;
}) {
  const cleanTitle = match?.title || formatFallbackTitle(id);
  const dateIso = match?.date
    ? new Date(match.date * 1000).toISOString()
    : new Date().toISOString();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `Live Streaming ${cleanTitle}`,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    startDate: dateIso,
    location: {
      '@type': 'VirtualLocation',
      url: `https://www.flstreams.my.id/watch/${source}/${id}`,
    },
    organizer: {
      '@type': 'Organization',
      name: 'FL Streams',
      url: 'https://www.flstreams.my.id',
    },
    competitor:
      match?.teams?.home?.name && match?.teams?.away?.name
        ? [
            {
              '@type': 'SportsTeam',
              name: match.teams.home.name,
            },
            {
              '@type': 'SportsTeam',
              name: match.teams.away.name,
            },
          ]
        : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  football: 'Sepak Bola · Liga Populer',
  soccer: 'Sepak Bola · Liga Populer',
  basketball: 'Basket · Liga Populer',
  tennis: 'Tenis · Liga Populer',
  cricket: 'Kriket · Liga Populer',
  boxing: 'Tinju/MMA · Liga Populer',
  motorsport: 'Motorsport · Liga Populer',
};

function getCategoryLabel(category?: string): string {
  if (!category) return 'Olahraga';
  const clean = category.toLowerCase();
  return CATEGORY_LABELS[clean] ?? `${category.charAt(0).toUpperCase() + category.slice(1)} · Liga Populer`;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function WatchPage({
  params,
}: {
  params: Promise<{ source: string; id: string }>;
}) {
  const { source, id } = await params;
  const match = await getMatchDetails(source, id);
  const cleanTitle = match?.title || formatFallbackTitle(id);

  return (
    <>
      <SportsEventSchema match={match} source={source} id={id} />
      <Navbar />
      <PopunderAd />

      <main className="max-w-[1600px] mx-auto px-3 sm:px-6 py-4 pb-16">
        {/* Top Action Bar */}
        <div className="mb-5 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-semibold rounded-lg shadow-sm transition-all duration-150 active:scale-95"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Beranda
          </Link>
          <div className="bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm capitalize">
            {getCategoryLabel(match?.category)}
          </div>
        </div>

        {/* WatchClient UI */}
        <WatchClient
          matchId={id}
          matchTitle={cleanTitle}
          sourceParam={source}
          idParam={id}
        />
      </main>
    </>
  );
}
