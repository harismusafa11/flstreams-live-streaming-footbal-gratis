'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MatchCard from '@/components/MatchCard';
import type { Match } from '@/lib/types';

const SPORTS = [
  { slug: 'all', label: '🏆 Semua' },
  { slug: 'soccer', label: '⚽ Sepak Bola' },
  { slug: 'basketball', label: '🏀 Basket' },
  { slug: 'tennis', label: '🎾 Tenis' },
  { slug: 'cricket', label: '🏏 Kriket' },
  { slug: 'combat', label: '🥊 Tinju/MMA' },
  { slug: 'racing', label: '🏎️ Motorsport' },
  { slug: 'hockey', label: '🏒 Hoki' },
  { slug: 'baseball', label: '⚾ Baseball' },
];

/** Skeleton only shown on very first load */
function SkeletonCard() {
  return (
    <div className="bg-[#060b14] border border-slate-800/70 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-36 bg-slate-800/40" />
      <div className="px-3.5 py-3 space-y-2">
        <div className="h-3 bg-slate-800 rounded w-3/4" />
        <div className="h-2.5 bg-slate-800 rounded w-1/2" />
      </div>
    </div>
  );
}

async function fetchMatches(sport: string): Promise<Match[]> {
  const url = `/api/matches?sport=${sport}&_t=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Determine if match is currently live based on timestamp */
function isMatchLive(match: Match): boolean {
  const nowSec = Math.floor(Date.now() / 1000);
  // Consider live if started within last 5 hours OR has viewers
  const fiveHoursAgo = nowSec - 5 * 3600;
  return match.date <= nowSec && match.date >= fiveHoursAgo;
}

export default function HomeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const sport = searchParams.get('sport') || 'all';
  const [matches, setMatches] = useState<Match[]>([]);
  const [firstLoad, setFirstLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isFirstFetch = useRef(true);

  const setSport = useCallback(
    (newSport: string) => {
      const params = new URLSearchParams(window.location.search);
      if (newSport === 'all') params.delete('sport');
      else params.set('sport', newSport);
      // Reset first load flag when switching sport
      isFirstFetch.current = true;
      setFirstLoad(true);
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  const loadMatches = useCallback(async () => {
    try {
      const data = await fetchMatches(sport);
      const arr = Array.isArray(data) ? data : [];
      // Sort: live first, then by timestamp asc
      arr.sort((a, b) => {
        const aLive = isMatchLive(a) ? 0 : 1;
        const bLive = isMatchLive(b) ? 0 : 1;
        if (aLive !== bLive) return aLive - bLive;
        return a.date - b.date;
      });
      setMatches(arr);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      console.error(e);
      setError('Gagal memuat data. Coba refresh halaman.');
    } finally {
      if (isFirstFetch.current) {
        isFirstFetch.current = false;
        setFirstLoad(false);
      }
    }
  }, [sport]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMatches();
    // Poll every 20 seconds — seamless, no loading flash
    const interval = setInterval(loadMatches, 20000);
    return () => clearInterval(interval);
  }, [loadMatches]);

  // Client-side search
  const filtered = matches.filter((m) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      m.title?.toLowerCase().includes(q) ||
      m.category?.toLowerCase().includes(q) ||
      m.league?.toLowerCase().includes(q) ||
      m.teams?.home?.name?.toLowerCase().includes(q) ||
      m.teams?.away?.name?.toLowerCase().includes(q)
    );
  });

  const liveMatches = filtered.filter(isMatchLive);
  const scheduledMatches = filtered.filter((m) => !isMatchLive(m));

  return (
    <div>
      {/* Search bar */}
      <div className="mb-5 flex gap-2 max-w-md">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari pertandingan atau tim..."
          className="flex-1 bg-slate-800/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 transition-colors"
          aria-label="Cari pertandingan"
        />
        {query && (
          <button onClick={() => setQuery('')} className="px-3 py-2 bg-slate-800 text-slate-400 rounded-xl text-sm hover:text-slate-200 transition-colors">
            ✕
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2 mb-5" role="tablist" aria-label="Filter olahraga">
        {/* Live indicator */}
        <div className="flex items-center gap-2 bg-red-600/10 border border-red-500/30 px-3 py-1.5 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-xs font-bold text-red-400 uppercase tracking-wide">Live Sekarang</span>
        </div>

        <div className="w-px h-4 bg-slate-800 mx-1" aria-hidden="true" />

        {SPORTS.map(({ slug, label }) => (
          <button
            key={slug}
            role="tab"
            aria-selected={sport === slug}
            onClick={() => setSport(slug)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              sport === slug
                ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stats */}
      {!firstLoad && !error && (
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              <span className="text-red-400 font-bold">{liveMatches.length}</span> live ·{' '}
              <span className="text-slate-400 font-bold">{scheduledMatches.length}</span> jadwal
              {query && ` · filter: "${query}"`}
            </span>
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Update {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex flex-col items-center justify-center py-16">
          <span className="text-4xl mb-3">⚠️</span>
          <p className="font-medium text-slate-400">{error}</p>
          <button onClick={loadMatches} className="mt-4 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-colors">
            Coba Lagi
          </button>
        </div>
      )}

      {/* FIRST LOAD skeleton */}
      {firstLoad && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── LIVE NOW section ─────────────────────────────── */}
      {!firstLoad && !error && liveMatches.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <h2 className="text-sm font-extrabold text-red-400 uppercase tracking-widest">Sedang Live</h2>
            <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold">
              {liveMatches.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" aria-live="polite">
            {liveMatches.map((match) => (
              <MatchCard key={match.id} match={match} isLive={true} />
            ))}
          </div>
        </section>
      )}

      {/* ── SCHEDULE section ─────────────────────────────── */}
      {!firstLoad && !error && scheduledMatches.length > 0 && (
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-slate-400 text-base">📅</span>
            <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">Jadwal Pertandingan</h2>
            <span className="text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-bold">
              {scheduledMatches.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {scheduledMatches.map((match) => (
              <MatchCard key={match.id} match={match} isLive={false} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!firstLoad && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24">
          <span className="text-5xl mb-4">📡</span>
          <p className="text-lg font-medium text-slate-400">Tidak ada pertandingan ditemukan</p>
          <p className="text-sm mt-1 text-slate-600">
            {sport !== 'all' ? 'Coba kategori lain' : 'Coba lagi nanti'}
          </p>
          <button onClick={loadMatches} className="mt-5 px-5 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold rounded-xl hover:bg-emerald-500/20 transition-colors">
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
