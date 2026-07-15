import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PopunderAd from '@/components/PopunderAd';
import WatchClient from './WatchClient';
import type { StreamFreeStream } from '@/lib/types';

const BASE_SF = 'https://streamfree.top';

interface MatchItem {
  name: string;
  category: string;
  league?: string;
  stream_key: string;
  match_timestamp: number;
  embed_url: string;
  thumbnail_url?: string;
}

// Fetch stream details from StreamFree API
async function getMatchDetails(
  category: string,
  streamKey: string,
): Promise<MatchItem | null> {
  try {
    // Try fetching the specific stream by key
    const res = await fetch(
      `${BASE_SF}/api/v1/streams/${encodeURIComponent(streamKey)}`,
      {
        next: { revalidate: 60 },
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FLStreams/2.0)',
          Accept: 'application/json',
          Referer: 'https://streamfree.top/',
        },
      },
    );

    if (res.ok) {
      const stream: StreamFreeStream = await res.json();
      return stream;
    }

    // Fallback: search in category stream list
    if (category) {
      const catRes = await fetch(
        `${BASE_SF}/api/v1/streams?category=${encodeURIComponent(category)}`,
        {
          next: { revalidate: 60 },
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; FLStreams/2.0)',
            Accept: 'application/json',
            Referer: 'https://streamfree.top/',
          },
        },
      );
      if (catRes.ok) {
        const data = await catRes.json();
        const found = (data.streams ?? []).find(
          (s: StreamFreeStream) => s.stream_key === streamKey,
        );
        if (found) return found;
      }
    }

    return null;
  } catch (e) {
    console.error('[getMatchDetails]', e);
    return null;
  }
}

// Convert id slug to clean title fallback
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

  const cleanTitle = match?.name || formatFallbackTitle(id);
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

// ── JSON-LD SportsEvent Schema ─────────────────────────────────────────────────
function SportsEventSchema({
  match,
  source,
  id,
}: {
  match: MatchItem | null;
  source: string;
  id: string;
}) {
  const cleanTitle = match?.name || formatFallbackTitle(id);
  const dateIso = match?.match_timestamp
    ? new Date(match.match_timestamp * 1000).toISOString()
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
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  soccer: 'Sepak Bola',
  football: 'Sepak Bola',
  basketball: 'Basket',
  tennis: 'Tenis',
  cricket: 'Kriket',
  combat: 'Tinju / MMA',
  boxing: 'Tinju / MMA',
  racing: 'Motorsport',
  motorsport: 'Motorsport',
  hockey: 'Hoki',
  baseball: 'Baseball',
};

function getCategoryLabel(category?: string): string {
  if (!category) return 'Olahraga';
  const clean = category.toLowerCase();
  return CATEGORY_LABELS[clean] ?? `${category.charAt(0).toUpperCase() + category.slice(1)}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function WatchPage({
  params,
}: {
  params: Promise<{ source: string; id: string }>;
}) {
  // `source` = StreamFree category (e.g. "soccer")
  // `id`     = stream_key (e.g. "ghana-vs-england")
  const { source, id } = await params;
  const match = await getMatchDetails(source, id);
  const cleanTitle = match?.name || formatFallbackTitle(id);
  const embedUrl = match?.embed_url ?? `${BASE_SF}/embed/${source}/${id}`;

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
            {getCategoryLabel(match?.category ?? source)}
          </div>
        </div>

        {/* WatchClient UI */}
        <WatchClient
          matchId={id}
          matchTitle={cleanTitle}
          sourceParam={source}
          idParam={id}
          embedUrl={embedUrl}
          league={match?.league}
        />
      </main>
    </>
  );
}
