// app/admin/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Calendar, Filter, Flame, RefreshCw, Pencil, Trash2, Shield, Eye, ShieldAlert, Check, X, AlertTriangle, Tv } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatToWIB } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [teamsCount, setTeamsCount] = useState(0);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHot, setSelectedHot] = useState('all');

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch matches with current filters
      const matchQueryParams = new URLSearchParams();
      if (selectedLeague !== 'all') matchQueryParams.append('leagueId', selectedLeague);
      if (selectedStatus !== 'all') matchQueryParams.append('status', selectedStatus);
      if (selectedDate) matchQueryParams.append('date', selectedDate);
      if (selectedHot === 'hot') matchQueryParams.append('isHot', 'true');
      if (selectedHot === 'regular') matchQueryParams.append('isHot', 'false');
      if (searchQuery.trim().length > 0) matchQueryParams.append('search', searchQuery);

      // We fetch filtered matches for the table
      const matchesRes = await fetch(`/api/matches?${matchQueryParams.toString()}&t=${Date.now()}`);
      const matchesData = await matchesRes.json();

      // We also fetch all matches, teams, and leagues to compute correct overall statistics
      const [allMatchesRes, teamsRes, leaguesRes] = await Promise.all([
        fetch(`/api/matches?t=${Date.now()}`),
        fetch(`/api/teams?t=${Date.now()}`),
        fetch(`/api/leagues?t=${Date.now()}`),
      ]);

      const allMatchesData = await allMatchesRes.json();
      const teamsData = await teamsRes.json();
      const leaguesData = await leaguesRes.json();

      setMatches(Array.isArray(matchesData) ? matchesData : []);
      setTeamsCount(Array.isArray(teamsData) ? teamsData.length : 0);
      setLeagues(Array.isArray(leaguesData) ? leaguesData : []);

      // If we fetched all matches, we store a separate state or calculate overall stats from it
      // Let's compute statistics from the overall unfiltered matches list
      const validAllMatches = Array.isArray(allMatchesData) ? allMatchesData : [];
      setStats({
        totalMatches: validAllMatches.length,
        liveMatches: validAllMatches.filter((m: any) => m.status === 'LIVE').length,
        upcomingMatches: validAllMatches.filter((m: any) => m.status === 'SCHEDULED').length,
        completedMatches: validAllMatches.filter((m: any) => m.status === 'COMPLETED').length,
        hotMatches: validAllMatches.filter((m: any) => m.isHot).length,
        totalTeams: Array.isArray(teamsData) ? teamsData.length : 0,
        totalLeagues: Array.isArray(leaguesData) ? leaguesData.length : 0,
        totalStreams: validAllMatches.reduce((acc: number, m: any) => acc + (m.matchStreams?.length || 0), 0),
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedLeague, selectedStatus, selectedDate, selectedHot, searchQuery]);

  // Overall Statistics state
  const [stats, setStats] = useState({
    totalMatches: 0,
    liveMatches: 0,
    upcomingMatches: 0,
    completedMatches: 0,
    hotMatches: 0,
    totalTeams: 0,
    totalLeagues: 0,
    totalStreams: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Inline Toggles
  const handleToggleHot = async (id: string, currentIsHot: boolean) => {
    setSubmittingId(id);
    try {
      const response = await fetch(`/api/matches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHot: !currentIsHot }),
      });
      if (!response.ok) throw new Error();
      fetchDashboardData();
    } catch (err) {
      alert('Gagal memperbarui status Hot Match.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleChangeStatus = async (id: string, newStatus: string) => {
    setSubmittingId(id);
    try {
      const response = await fetch(`/api/matches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error();
      fetchDashboardData();
    } catch (err) {
      alert('Gagal memperbarui status pertandingan.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDeleteMatch = async (id: string) => {
    try {
      const response = await fetch(`/api/matches/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error();
      setDeleteConfirmId(null);
      fetchDashboardData();
    } catch (err) {
      alert('Gagal menghapus pertandingan.');
    }
  };

  return (
    <div className="space-y-8 select-none">
      {/* Title Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            OVERVIEW DASHBOARD
            <span className="text-emerald-400 font-medium text-[10px] tracking-widest uppercase bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">Live Deck</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Kelola data pertandingan sepak bola, server streaming, dan metadata SEO.</p>
        </div>
        <div>
          <Link
            href="/admin/matches/create"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-650 text-white px-5 py-3 rounded-2xl font-extrabold text-xs uppercase tracking-wider transition-all duration-150 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-900/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Pertandingan</span>
          </Link>
        </div>
      </header>

      {/* 8 Statistics Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Match */}
        <div className="bg-[#0c0c11]/80 backdrop-blur-sm border border-white/[0.04] p-5 rounded-2xl shadow-xl flex flex-col justify-between group">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Total Match</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-white">{stats.totalMatches}</span>
            <span className="text-[9px] font-bold text-zinc-500 bg-white/5 px-2 py-0.5 rounded">Laga</span>
          </div>
        </div>

        {/* Live Match */}
        <div className="bg-[#0c0c11]/80 backdrop-blur-sm border border-red-500/10 p-5 rounded-2xl shadow-xl flex flex-col justify-between group">
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live Match
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-red-500">{stats.liveMatches}</span>
            <span className="text-[9px] font-bold text-red-500/20 bg-red-500/5 border border-red-500/10 px-2 py-0.5 rounded uppercase">Aktif</span>
          </div>
        </div>

        {/* Upcoming Match */}
        <div className="bg-[#0c0c11]/80 backdrop-blur-sm border border-cyan-500/10 p-5 rounded-2xl shadow-xl flex flex-col justify-between group">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">Upcoming Match</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-cyan-400">{stats.upcomingMatches}</span>
            <span className="text-[9px] font-bold text-cyan-500/20 bg-cyan-500/5 border border-cyan-500/10 px-2 py-0.5 rounded uppercase">Jadwal</span>
          </div>
        </div>

        {/* Finished Match */}
        <div className="bg-[#0c0c11]/80 backdrop-blur-sm border border-white/[0.04] p-5 rounded-2xl shadow-xl flex flex-col justify-between group">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Finished Match</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-zinc-300">{stats.completedMatches}</span>
            <span className="text-[9px] font-bold text-zinc-500 bg-white/5 px-2 py-0.5 rounded uppercase">Selesai</span>
          </div>
        </div>

        {/* Hot Match */}
        <div className="bg-[#0c0c11]/80 backdrop-blur-sm border border-amber-500/10 p-5 rounded-2xl shadow-xl flex flex-col justify-between group">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-amber-500/10 text-amber-400 animate-bounce" /> Hot Match
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-400">{stats.hotMatches}</span>
            <span className="text-[9px] font-bold text-amber-500/20 bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded uppercase">Utama</span>
          </div>
        </div>

        {/* Total Teams */}
        <div className="bg-[#0c0c11]/80 backdrop-blur-sm border border-white/[0.04] p-5 rounded-2xl shadow-xl flex flex-col justify-between group">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Total Teams</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-white">{stats.totalTeams}</span>
            <span className="text-[9px] font-bold text-zinc-500 bg-white/5 px-2 py-0.5 rounded uppercase">Tim</span>
          </div>
        </div>

        {/* Total Leagues */}
        <div className="bg-[#0c0c11]/80 backdrop-blur-sm border border-white/[0.04] p-5 rounded-2xl shadow-xl flex flex-col justify-between group">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Total Leagues</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-white">{stats.totalLeagues}</span>
            <span className="text-[9px] font-bold text-zinc-500 bg-white/5 px-2 py-0.5 rounded uppercase">Liga</span>
          </div>
        </div>

        {/* Total Stream Server */}
        <div className="bg-[#0c0c11]/80 backdrop-blur-sm border border-emerald-500/10 p-5 rounded-2xl shadow-xl flex flex-col justify-between group">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Stream Server</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-450">{stats.totalStreams}</span>
            <span className="text-[9px] font-bold text-emerald-550/20 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded uppercase">Server</span>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="bg-[#0c0c11]/90 border border-white/5 p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-zinc-400 pb-2 border-b border-white/5">
          <Filter className="w-4 h-4 text-zinc-400" />
          <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Pencarian & Filter Laga</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-white/20" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pertandingan..."
              className="w-full bg-black/30 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/60 transition-all text-white placeholder-white/25"
            />
          </div>

          {/* League Filter */}
          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/60 transition-all text-zinc-300"
          >
            <option value="all">Semua Liga</option>
            {leagues.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/60 transition-all text-zinc-300"
          >
            <option value="all">Semua Status</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="LIVE">Live</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Date Filter */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/60 transition-all text-zinc-300"
            />
          </div>

          {/* Hot Match Filter */}
          <select
            value={selectedHot}
            onChange={(e) => setSelectedHot(e.target.value)}
            className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/60 transition-all text-zinc-300"
          >
            <option value="all">Semua Laga</option>
            <option value="hot">🔥 Hot Match</option>
            <option value="regular">Biasa</option>
          </select>
        </div>
      </section>

      {/* Matches ledger ledger table */}
      <section className="bg-[#0c0c11]/80 border border-white/5 rounded-3xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-500 space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin text-red-500" />
            <p className="text-xs uppercase tracking-widest">Memuat database pertandingan...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-28 text-zinc-550 flex flex-col items-center justify-center p-6">
            <Tv className="w-10 h-10 text-zinc-700 mb-3" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tidak ada pertandingan</h3>
            <p className="text-xs mt-1.5 text-zinc-500 max-w-sm leading-relaxed">
              Tidak ditemukan data yang cocok dengan kriteria filter Anda. Silakan ubah filter atau buat pertandingan baru.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01]">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Liga</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Home Team</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Away Team</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Kick Off</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Hot Match</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">SEO Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Streaming Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Last Update</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {matches.map((match) => {
                  const hasSeo = match.seoMetadata && match.seoMetadata.slug;
                  const activeStreams = match.matchStreams ? match.matchStreams.filter((s: any) => s.status === 'ACTIVE').length : 0;
                  
                  return (
                    <tr key={match.id} className="hover:bg-white/[0.01] transition-colors">
                      {/* League */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {match.league?.logo ? (
                            <Image src={match.league.logo} alt="" width={20} height={20} className="w-5 h-5 object-contain bg-white/5 rounded-md p-0.5" />
                          ) : (
                            <div className="w-5 h-5 bg-white/5 border border-white/10 rounded-md flex items-center justify-center text-[8px] font-bold text-zinc-400">
                              LG
                            </div>
                          )}
                          <span className="text-xs font-bold text-zinc-200 line-clamp-1">{match.league?.name || 'Liga'}</span>
                        </div>
                      </td>

                      {/* Home Team */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {match.homeTeam?.logo ? (
                            <Image src={match.homeTeam.logo} alt="" width={20} height={20} className="w-5 h-5 object-contain bg-white/5 rounded-md p-0.5" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-5 h-5 bg-white/5 border border-white/10 rounded-md flex items-center justify-center text-[8px] font-bold text-zinc-400">
                              HT
                            </div>
                          )}
                          <span className="text-xs font-bold text-white line-clamp-1">{match.homeTeam?.name || 'Tuan Rumah'}</span>
                        </div>
                      </td>

                      {/* Away Team */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {match.awayTeam?.logo ? (
                            <Image src={match.awayTeam.logo} alt="" width={20} height={20} className="w-5 h-5 object-contain bg-white/5 rounded-md p-0.5" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-5 h-5 bg-white/5 border border-white/10 rounded-md flex items-center justify-center text-[8px] font-bold text-zinc-400">
                              AT
                            </div>
                          )}
                          <span className="text-xs font-bold text-white line-clamp-1">{match.awayTeam?.name || 'Lawan'}</span>
                        </div>
                      </td>

                      {/* Kick Off */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-bold text-zinc-300 block">{formatToWIB(match.startTime, 'dd MMM • HH:mm')}</span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <select
                          value={match.status}
                          disabled={submittingId === match.id}
                          onChange={(e) => handleChangeStatus(match.id, e.target.value)}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border focus:outline-none transition-all ${
                            match.status === 'LIVE' ? 'bg-red-950/40 text-red-500 border-red-500/30' :
                            match.status === 'COMPLETED' ? 'bg-white/5 text-white/40 border-white/10' :
                            'bg-cyan-950/40 text-cyan-400 border-cyan-500/20'
                          }`}
                        >
                          <option value="SCHEDULED">Scheduled</option>
                          <option value="LIVE">🔴 Live</option>
                          <option value="COMPLETED">✅ Completed</option>
                        </select>
                      </td>

                      {/* Hot Match Toggle */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleHot(match.id, match.isHot)}
                          disabled={submittingId === match.id}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 border ${
                            match.isHot
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 font-extrabold'
                              : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-zinc-350 hover:bg-white/5'
                          }`}
                          title="Tandai sebagai pertandingan populer/panas"
                        >
                          <span>🔥</span>
                          <span>{match.isHot ? 'Hot' : 'Biasa'}</span>
                        </button>
                      </td>

                      {/* SEO Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasSeo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                            <Check className="w-2.5 h-2.5" /> SEO OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                            <X className="w-2.5 h-2.5" /> NO SEO
                          </span>
                        )}
                      </td>

                      {/* Streaming Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {activeStreams > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                            {activeStreams} Server
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-red-500/10 text-red-400 border border-red-500/25">
                            Off-stream
                          </span>
                        )}
                      </td>

                      {/* Last Update */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-500">
                        {formatToWIB(match.updatedAt, 'HH:mm')} WIB
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {deleteConfirmId === match.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleDeleteMatch(match.id)}
                              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all h-8 flex items-center justify-center"
                            >
                              Hapus
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all h-8 w-8 flex items-center justify-center"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {hasSeo && (
                              <a
                                href={`/match/${match.seoMetadata.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-zinc-900 border border-white/5 text-zinc-450 hover:text-white hover:bg-white/5 rounded-xl transition-all h-8 w-8 flex items-center justify-center"
                                title="Lihat halaman streaming laga"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <Link
                              href={`/admin/matches/${match.id}/edit`}
                              className="p-2 bg-zinc-900 border border-white/5 text-zinc-450 hover:text-white hover:bg-white/5 rounded-xl transition-all h-8 w-8 flex items-center justify-center"
                              title="Edit Detail Pertandingan"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => setDeleteConfirmId(match.id)}
                              className="p-2 bg-zinc-900 border border-white/5 text-zinc-450 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 rounded-xl transition-all h-8 w-8 flex items-center justify-center"
                              title="Hapus Laga"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
