import Link from 'next/link';
import type { Match } from '@/lib/types';

interface MatchCardProps {
  match: Match;
  isLive?: boolean;
}

const SPORT_ICONS: Record<string, string> = {
  football: '⚽',
  basketball: '🏀',
  tennis: '🎾',
  baseball: '⚾',
  cricket: '🏏',
  rugby: '🏉',
  hockey: '🏒',
  'american-football': '🏈',
  mma: '🥊',
  boxing: '🥊',
  motorsport: '🏎️',
  golf: '⛳',
};

function getSportIcon(category: string): string {
  return SPORT_ICONS[category?.toLowerCase()] ?? '🏆';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .trim();
}

export default function MatchCard({ match, isLive = false }: MatchCardProps) {
  const source = match.sources?.[0];
  const href = source
    ? `/watch/${source.source}/${source.id}`
    : '#';

  const startTime = match.date
    ? new Date(match.date * 1000).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
      }) + ' WIB'
    : null;

  return (
    <Link
      href={href}
      className="group block relative bg-[#090d16]/80 border border-slate-800/80 rounded-xl overflow-hidden hover:border-emerald-500/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300"
      aria-label={`Tonton ${match.title}`}
    >
      {/* Gradient header */}
      <div className="relative h-40 bg-gradient-to-br from-[#0c1e19]/60 via-[#0a0f1d] to-[#05080f] flex items-center justify-center overflow-hidden">

        {/* Gradient overlays to blur out watermark logo and improve readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-[#090d16]/80 z-10" />

        {/* Team badges */}
        <div className="relative z-20 flex items-center gap-4">
          {match.teams?.home?.name && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={match.teams.home.badge ? `https://streamed.pk/api/images/badge/${match.teams.home.badge}.webp` : `https://streamed.pk/api/images/badge/${slugify(match.teams.home.name)}.webp`}
              alt={match.teams.home.name}
              className="w-12 h-12 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] transform group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          {(match.teams?.home?.name || match.teams?.away?.name) && (
            <span className="text-slate-400 font-extrabold text-[10px] bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-850 backdrop-blur-sm select-none">VS</span>
          )}
          {match.teams?.away?.name && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={match.teams.away.badge ? `https://streamed.pk/api/images/badge/${match.teams.away.badge}.webp` : `https://streamed.pk/api/images/badge/${slugify(match.teams.away.name)}.webp`}
              alt={match.teams.away.name}
              className="w-12 h-12 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] transform group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          {!match.teams?.home?.name && !match.teams?.away?.name && (
            <span className="text-4xl select-none">{getSportIcon(match.category)}</span>
          )}
        </div>

        {/* Live indicator badge */}
        {isLive && (
          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
            </span>
            LIVE
          </div>
        )}

        {/* Category */}
        <div className="absolute top-2.5 right-2.5 z-20 bg-slate-950/90 border border-slate-800 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
          {match.category}
        </div>
      </div>

      {/* Match info */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-slate-100 leading-tight line-clamp-2 group-hover:text-emerald-400 transition-colors">
          {match.title}
        </h3>
        <div className="flex items-center justify-between mt-2">
          {startTime && (
            <span className="text-xs text-slate-500">🕐 {startTime}</span>
          )}
          <span className="text-xs text-emerald-400/70 ml-auto">
            {match.sources?.length ?? 0} server →
          </span>
        </div>
      </div>
    </Link>
  );
}
