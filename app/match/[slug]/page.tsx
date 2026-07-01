// app/match/[slug]/page.tsx
import { MatchService } from '@/lib/services/MatchService';
import LiveMatchClient from '@/app/live/[id]/LiveMatchClient';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const match = await MatchService.getMatchBySlug(slug);

  if (!match) {
    return {
      title: 'Pertandingan Tidak Ditemukan | FL Streams',
      description: 'Nonton live streaming sepak bola gratis kualitas HD.',
    };
  }

  const homeName = (match as any).homeTeam?.name || 'Home Team';
  const awayName = (match as any).awayTeam?.name || 'Away Team';
  const leagueName = (match as any).league?.name || 'League';
  const seo = (match as any).seoMetadata || {};

  return {
    title: seo.metaTitle || `${homeName} vs ${awayName} Live Streaming | ${leagueName}`,
    description: seo.metaDescription || `Nonton siaran langsung ${homeName} vs ${awayName} gratis tanpa buffering di FL Streams.`,
    alternates: {
      canonical: seo.canonicalUrl || undefined,
    },
    robots: seo.robots || 'index, follow',
    keywords: seo.focusKeyword || undefined,
    openGraph: {
      title: seo.ogTitle || seo.metaTitle || `${homeName} vs ${awayName} Live Streaming`,
      description: seo.ogDescription || seo.metaDescription || `Nonton siaran langsung ${homeName} vs ${awayName} gratis.`,
      images: seo.ogImage ? [{ url: seo.ogImage }] : undefined,
      type: 'video.other',
    },
  };
}

export default async function MatchSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const rawMatch = await MatchService.getMatchBySlug(slug);
  if (!rawMatch) return notFound();

  const m = rawMatch as any;

  // Map relational data to flat shape expected by LiveMatchClient
  const match = {
    id: m.id,
    homeTeam: m.homeTeam?.name || 'Home Team',
    awayTeam: m.awayTeam?.name || 'Away Team',
    homeLogo: m.homeTeam?.logo || null,
    awayLogo: m.awayTeam?.logo || null,
    competition: m.league?.name || 'Football Match',
    startTime: m.startTime,
    status: m.status,
    embedCode: m.matchStreams
      ? m.matchStreams.filter((s: any) => s.status === 'ACTIVE').map((s: any) => s.embedCode).join('\n')
      : '',
    matchStreams: m.matchStreams || [],
    slug: m.seoMetadata?.slug || '',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-50 selection:bg-red-600/30 selection:text-white">
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-md px-6 py-4 fixed top-0 w-full z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 transition-opacity hover:opacity-80">
            <span className="text-xl font-black tracking-tighter text-white">
              FL <span className="text-red-500">STREAMS</span>
            </span>
          </Link>
        </div>
      </header>
      <main className="pt-20">
        <LiveMatchClient match={JSON.parse(JSON.stringify(match))} />
      </main>
    </div>
  );
}
