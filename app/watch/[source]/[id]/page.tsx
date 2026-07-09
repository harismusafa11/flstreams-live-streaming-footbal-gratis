import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import WatchClient from './WatchClient';

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ source: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Live Stream ${id} — FL Streams`,
    description: `Tonton live stream pertandingan olahraga gratis di FL Streams. Kualitas HD, tersedia server cadangan.`,
    openGraph: { type: 'video.other' },
  };
}

// ── JSON-LD SportsEvent Schema (injected as static shell; real data filled client-side) ─
function SportsEventSchema({
  source,
  id,
}: {
  source: string;
  id: string;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `Live Sport Stream`,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
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
  football: 'Football · Liga Populer',
  basketball: 'Basketball · Liga Populer',
  tennis: 'Tennis · Liga Populer',
  cricket: 'Cricket · Liga Populer',
  boxing: 'MMA/Boxing · Liga Populer',
  motorsport: 'Motorsport · Liga Populer',
};

function getCategoryLabel(source: string): string {
  const clean = source.toLowerCase();
  return CATEGORY_LABELS[clean] ?? `${source.charAt(0).toUpperCase() + source.slice(1)} · Liga Populer`;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function WatchPage({
  params,
}: {
  params: Promise<{ source: string; id: string }>;
}) {
  const { source, id } = await params;

  return (
    <>
      <SportsEventSchema source={source} id={id} />
      <Navbar />

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
            {getCategoryLabel(source)}
          </div>
        </div>

        {/* All interactive content fetched client-side to bypass Cloudflare */}
        <WatchClient
          matchId={id}
          matchTitle={`Live: ${id}`}
          sourceParam={source}
          idParam={id}
        />
      </main>
    </>
  );
}
