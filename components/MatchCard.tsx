'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import type { Match } from '@/lib/types';

interface MatchCardProps {
  match: Match;
  isLive?: boolean;
}

const SPORT_GRADIENT: Record<string, string> = {
  football:   'from-emerald-950 via-slate-900 to-slate-950',
  soccer:     'from-emerald-950 via-slate-900 to-slate-950',
  basketball: 'from-orange-950 via-slate-900 to-slate-950',
  tennis:     'from-lime-950 via-slate-900 to-slate-950',
  cricket:    'from-amber-950 via-slate-900 to-slate-950',
  combat:     'from-red-950 via-slate-900 to-slate-950',
  mma:        'from-red-950 via-slate-900 to-slate-950',
  boxing:     'from-red-950 via-slate-900 to-slate-950',
  racing:     'from-blue-950 via-slate-900 to-slate-950',
  motorsport: 'from-blue-950 via-slate-900 to-slate-950',
  hockey:     'from-cyan-950 via-slate-900 to-slate-950',
  baseball:   'from-rose-950 via-slate-900 to-slate-950',
};

function getSportGradient(cat: string) {
  return SPORT_GRADIENT[cat?.toLowerCase()] ?? 'from-slate-900 via-slate-800 to-slate-950';
}



/** Format scheduled time in WIB */
function formatScheduleTime(unixSec: number) {
  const d = new Date(unixSec * 1000);
  const now = new Date();
  const isToday =
    d.toDateString() === now.toDateString() ||
    d.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }) ===
      now.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });

  const time = d.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta',
  }).replace('.', ':');

  if (isToday) return `${time} WIB`;
  const date = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' });
  return `${date}, ${time} WIB`;
}

export default function MatchCard({ match, isLive = false }: MatchCardProps) {
  const source = match.sources?.[0];
  const href = source ? `/watch/${source.source}/${source.id}` : '#';

  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const iv = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 60000);
    return () => clearInterval(iv);
  }, []);

  const fiveHoursAgo = nowSec - 5 * 3600;
  const isCurrentlyLive = match.date <= nowSec && match.date >= fiveHoursAgo;
  const showLive = isLive || isCurrentlyLive;

  const homeLogo = match.teams?.home?.logo;
  const awayLogo = match.teams?.away?.logo;
  const hasTeamLogos = !!(homeLogo || awayLogo);
  const gradient = getSportGradient(match.category);

  const scheduleTime = !showLive && match.date ? formatScheduleTime(match.date) : null;

  return (
    <Link
      href={href}
      className={`group block relative rounded-2xl overflow-hidden transition-all duration-300 ${
        showLive
          ? 'bg-[#060b14] border border-red-500/25 hover:border-red-500/60 hover:shadow-[0_0_30px_rgba(239,68,68,0.12)] ring-1 ring-red-500/10'
          : 'bg-[#060b14] border border-slate-800/70 hover:border-emerald-500/50 hover:shadow-[0_0_28px_rgba(16,185,129,0.08)]'
      }`}
      aria-label={`Tonton ${match.title}`}
    >
      {/* Live pulsing border glow overlay */}
      {showLive && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none z-0 overflow-hidden">
          <div className="absolute inset-0 animate-[pulse_3s_ease-in-out_infinite] bg-gradient-to-br from-red-500/5 via-transparent to-red-500/5" />
        </div>
      )}

      {/* ── Header Image Area ───────────────────── */}
      <div className={`relative h-36 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />

        {hasTeamLogos ? (
          /* ── Team Logos ─────────────────────── */
          <div className="relative z-10 flex items-center justify-center gap-3 px-4 w-full">
            {/* Home */}
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              {homeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={homeLogo}
                  alt={match.teams?.home?.name ?? 'Home'}
                  className={`w-14 h-14 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-transform duration-300 ${showLive ? 'group-hover:scale-115 drop-shadow-[0_0_12px_rgba(255,80,80,0.25)]' : 'group-hover:scale-110'}`}
                  loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 text-xs font-bold">
                  {match.teams?.home?.name?.[0] ?? '?'}
                </div>
              )}
              <span className="text-[8.5px] font-semibold text-slate-400 text-center line-clamp-2 max-w-[72px] leading-tight">
                {match.teams?.home?.name}
              </span>
            </div>

            {/* VS */}
            <div className="shrink-0">
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${showLive ? 'text-red-400 bg-red-950/60 border-red-800/60' : 'text-slate-500 bg-slate-900/90 border-slate-700'}`}>
                VS
              </span>
            </div>

            {/* Away */}
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              {awayLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={awayLogo}
                  alt={match.teams?.away?.name ?? 'Away'}
                  className={`w-14 h-14 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-transform duration-300 ${showLive ? 'group-hover:scale-115' : 'group-hover:scale-110'}`}
                  loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 text-xs font-bold">
                  {match.teams?.away?.name?.[0] ?? '?'}
                </div>
              )}
              <span className="text-[8.5px] font-semibold text-slate-400 text-center line-clamp-2 max-w-[72px] leading-tight">
                {match.teams?.away?.name}
              </span>
            </div>
          </div>
        ) : (
          /* ── Channel / Broadcast ────────────── */
          <div className="relative z-10 px-5 text-center">
            <div className="text-2xl mb-1.5 select-none opacity-40">📡</div>
            <span className="text-sm font-bold text-slate-300 line-clamp-3 leading-snug">{match.title}</span>
          </div>
        )}

        {/* League */}
        {match.league && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center z-20">
            <span className="text-[8.5px] font-semibold text-slate-400 bg-slate-950/80 border border-slate-800 px-2.5 py-0.5 rounded-full truncate max-w-[80%]">
              {match.league}
            </span>
          </div>
        )}

        {/* LIVE badge */}
        {showLive && (
          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-red-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-lg shadow-red-900/60">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
            </span>
            LIVE
          </div>
        )}

        {/* Scheduled badge */}
        {!showLive && (
          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 bg-slate-800/90 text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded-full border border-slate-700">
            📅 JADWAL
          </div>
        )}


        {/* Category pill */}
        <div className="absolute bottom-2 right-2.5 z-20 bg-slate-950/90 border border-slate-800 text-emerald-400 text-[8.5px] font-bold px-2 py-0.5 rounded-full capitalize">
          {match.category}
        </div>
      </div>

      {/* ── Card Body ───────────────────────────── */}
      <div className="px-3.5 pt-3 pb-3.5 relative z-10">
        <h3 className={`text-[12.5px] font-semibold leading-snug line-clamp-2 transition-colors duration-200 ${showLive ? 'text-slate-100 group-hover:text-red-400' : 'text-slate-300 group-hover:text-emerald-400'}`}>
          {match.title}
        </h3>

        <div className="flex items-center justify-between mt-2.5 gap-2">
          {/* Time display */}
          {scheduleTime ? (
            <span className="text-[10px] text-slate-500 flex items-center gap-1" suppressHydrationWarning>
              🕐 {scheduleTime}
            </span>
          ) : showLive ? (
            <span className="text-[10px] text-red-400/80 font-bold flex items-center gap-1">
              Sedang Berlangsung
            </span>
          ) : null}

          {/* Tonton button */}
          <Link
            href={href}
            onClick={(e) => e.stopPropagation()}
            className={`ml-auto flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all duration-200 ${
              showLive
                ? 'bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 hover:shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 hover:border-emerald-500 hover:shadow-[0_0_10px_rgba(16,185,129,0.35)]'
            } group-hover:scale-105`}
            aria-label={`Tonton ${match.title}`}
          >
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            {showLive ? 'Tonton Live' : 'Tonton'}
          </Link>
        </div>
      </div>

      {/* Bottom hover line */}
      <div className={`absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${showLive ? 'bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0' : 'bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0'}`} />
    </Link>
  );
}
