'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MatchCard from '@/components/MatchCard';
import type { Match } from '@/lib/types';

const STREAMED_BASE = 'https://streamed.pk';

const SPORTS = [
  { slug: 'all', label: '🏆 Semua' },
  { slug: 'football', label: '⚽ Sepak Bola' },
  { slug: 'basketball', label: '🏀 Basket' },
  { slug: 'tennis', label: '🎾 Tenis' },
  { slug: 'cricket', label: '🏏 Kriket' },
  { slug: 'boxing', label: '🥊 Tinju/MMA' },
  { slug: 'motorsport', label: '🏎️ Motorsport' },
];

type FilterType = 'today' | 'live';

function SkeletonCard() {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden animate-pulse">
      <div className="h-28 bg-slate-800" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-slate-800 rounded w-3/4" />
        <div className="h-2 bg-slate-800 rounded w-1/2" />
      </div>
    </div>
  );
}

async function fetchMatches(filter: FilterType, sport: string): Promise<Match[]> {
  let endpoint: string;

  if (filter === 'live') {
    endpoint = `${STREAMED_BASE}/api/matches/live`;
  } else if (sport !== 'all') {
    endpoint = `${STREAMED_BASE}/api/matches/${encodeURIComponent(sport)}`;
  } else {
    endpoint = `${STREAMED_BASE}/api/matches/all-today`;
  }

  const res = await fetch(endpoint, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function HomeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filter = (searchParams.get('filter') as FilterType) || 'today';
  const sport = searchParams.get('sport') || 'all';

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const setFilter = useCallback(
    (newFilter: FilterType) => {
      const params = new URLSearchParams(window.location.search);
      if (newFilter === 'today') {
        params.delete('filter');
      } else {
        params.set('filter', newFilter);
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  const setSport = useCallback(
    (newSport: string) => {
      const params = new URLSearchParams(window.location.search);
      if (newSport === 'all') {
        params.delete('sport');
      } else {
        params.set('sport', newSport);
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  const loadMatches = useCallback(async () => {
    await Promise.resolve(); // Defer state changes to avoid synchronous setState within useEffect
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMatches(filter, sport);
      setMatches(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError('Gagal memuat pertandingan. Coba refresh halaman.');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [filter, sport]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMatches();
  }, [loadMatches]);

  // Client-side search filter
  const filtered = query.trim()
    ? matches.filter((m) =>
        m.title?.toLowerCase().includes(query.toLowerCase()) ||
        m.category?.toLowerCase().includes(query.toLowerCase()) ||
        m.teams?.home?.name?.toLowerCase().includes(query.toLowerCase()) ||
        m.teams?.away?.name?.toLowerCase().includes(query.toLowerCase())
      )
    : matches;

  const isLive = filter === 'live';

  return (
    <div>
      {/* Search */}
      <div className="mb-5 flex gap-2 max-w-md">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari pertandingan..."
          className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
          aria-label="Cari pertandingan"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="px-3 py-2 bg-slate-800 text-slate-400 rounded-xl text-sm hover:text-slate-200 transition-colors"
            aria-label="Hapus pencarian"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2 mb-5" role="tablist" aria-label="Filter pertandingan">
        {/* Live / Today */}
        {(
          [
            { key: 'today', label: '📅 Hari Ini' },
            { key: 'live', label: '🔴 Live Sekarang' },
          ] as { key: FilterType; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            aria-selected={filter === key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              filter === key
                ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-emerald-500/50 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}

        <div className="w-px bg-slate-800 mx-1 self-stretch" aria-hidden="true" />

        {/* Sport filter */}
        {SPORTS.map(({ slug, label }) => (
          <button
            key={slug}
            role="tab"
            aria-selected={sport === slug}
            onClick={() => setSport(slug)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              sport === slug
                ? 'bg-slate-700 text-slate-100 border-slate-600'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Match count */}
      {!loading && !error && (
        <p className="text-xs text-slate-500 mb-3">
          {filtered.length} pertandingan ditemukan
          {query && ` untuk "${query}"`}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <span className="text-4xl mb-3">⚠️</span>
          <p className="font-medium text-slate-400">{error}</p>
          <button
            onClick={loadMatches}
            className="mt-4 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Grid */}
      {!error && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          aria-live="polite"
          aria-busy={loading}
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : filtered.length === 0
            ? (
              <div className="col-span-full flex flex-col items-center justify-center py-24 text-slate-500">
                <span className="text-5xl mb-4">📭</span>
                <p className="text-lg font-medium text-slate-400">
                  Tidak ada pertandingan ditemukan
                </p>
                <p className="text-sm mt-1">
                  Coba filter lain atau tunggu jadwal berikutnya
                </p>
              </div>
            )
            : filtered.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                isLive={isLive}
              />
            ))}
        </div>
      )}
    </div>
  );
}
