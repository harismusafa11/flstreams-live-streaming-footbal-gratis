'use client';

import { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';
import { PlayCircle, Clock, Trophy, Search, Activity, CalendarDays, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { formatToWIB } from '@/lib/utils';

type Match = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  competition: string | null;
  startTime: string; // ISO string from JSON
  embedCode: string;
  status: string;
  isFeatured?: boolean;
};

// Seeded gradient for team avatars generator
function getTeamGradient(teamName: string) {
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'from-rose-600 to-orange-500',
    'from-blue-600 to-cyan-500',
    'from-emerald-600 to-teal-500',
    'from-violet-600 to-indigo-500',
    'from-fuchsia-600 to-pink-500',
    'from-amber-500 to-red-600',
    'from-cyan-500 to-blue-700',
    'from-purple-600 to-fuchsia-500',
  ];
  return colors[Math.abs(hash) % colors.length];
}

function getTeamInitials(teamName: string) {
  if (!teamName) return 'FC';
  const parts = teamName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return teamName.trim().substring(0, 2).toUpperCase();
}

function Countdown({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const calcTime = () => {
      const now = new Date();
      const diff = differenceInSeconds(targetDate, now);
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      setTimeLeft({
        d: Math.floor(diff / (3600 * 24)),
        h: Math.floor((diff % (3600 * 24)) / 3600),
        m: Math.floor((diff % 3600) / 60),
        s: diff % 60,
      });
    };
    calcTime();
    const interval = setInterval(calcTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center space-x-1 sm:space-x-2 text-xs font-mono text-emerald-400 bg-emerald-950/25 px-3 py-1.5 rounded-full border border-emerald-500/10">
      <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse mr-1" />
      <span className="tabular-nums font-semibold">{timeLeft.d}d</span>
      <span className="text-emerald-500/50">:</span>
      <span className="tabular-nums font-semibold">{timeLeft.h.toString().padStart(2, '0')}h</span>
      <span className="text-emerald-500/50">:</span>
      <span className="tabular-nums font-semibold">{timeLeft.m.toString().padStart(2, '0')}m</span>
      <span className="text-emerald-500/50">:</span>
      <span className="tabular-nums font-semibold">{timeLeft.s.toString().padStart(2, '0')}s</span>
    </div>
  );
}

export default function MatchesView({ initialMatches }: { initialMatches: Match[] }) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'upcoming'>('all');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [layoutMode, setLayoutMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    const initTimer = setTimeout(() => {
      setMounted(true);
      setCurrentTime(new Date());
    }, 0);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 10);
    return () => {
      clearTimeout(initTimer);
      clearInterval(timer);
    };
  }, []);

  const isLive = (match: Match) => {
    if (match.status === 'LIVE') return true;
    const startTime = new Date(match.startTime);
    if (mounted && currentTime) {
      if (match.status === 'SCHEDULED' && currentTime >= startTime) return true;
    }
    return false;
  };

  // Get unique list of competitions for the league-selection pill filter
  const leagues = ['all', ...Array.from(new Set(initialMatches.map(m => m.competition || 'Football Special')))];

  // Filter & Search Logic
  const filteredMatches = initialMatches.filter(match => {
    const live = isLive(match);
    
    // Search filter
    const matchesSearch = 
      match.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (match.competition && match.competition.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab === 'live' && !live) return false;
    if (activeTab === 'upcoming' && live) return false;

    // League filter
    if (selectedLeague !== 'all' && (match.competition || 'Football Special') !== selectedLeague) return false;

    return true;
  });

  const liveCount = initialMatches.filter(isLive).length;
  const upcomingCount = initialMatches.length - liveCount;

  return (
    <div className="space-y-6">
      
      {/* Category Pills & Grid-List Toggle Controls */}
      <div className="flex flex-col gap-4">
        
        {/* Search & Layout Toggle row */}
        <div className="flex flex-col gap-3 bg-zinc-900/50 p-4 rounded-2xl border border-white/[0.06] backdrop-blur-md">
          
          {/* Tabs */}
          <div className="flex flex-wrap p-1 bg-black/40 rounded-xl border border-white/5 w-full md:w-fit justify-center md:justify-start gap-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 flex-1 justify-center md:flex-none ${
                activeTab === 'all' 
                  ? 'bg-zinc-800 text-white shadow-md' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Semua ({initialMatches.length})</span>
            </button>
            
            <button
              onClick={() => setActiveTab('live')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 flex-1 justify-center md:flex-none ${
                activeTab === 'live' 
                  ? 'bg-red-600/90 text-white shadow-[0_0_15px_rgba(220,38,38,0.25)]' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>Live Now ({liveCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 flex-1 justify-center md:flex-none ${
                activeTab === 'upcoming' 
                  ? 'bg-zinc-800 text-white shadow-md' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Akan Datang ({upcomingCount})</span>
            </button>
          </div>

          {/* Search Box & Layout Switcher */}
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/30 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium placeholder-zinc-500 focus:outline-none focus:border-white/15 focus:bg-black/50 transition-all text-white"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Layout Toggle */}
            <div className="bg-black/40 rounded-xl p-0.5 border border-white/5 flex items-center shrink-0">
              <button
                onClick={() => setLayoutMode('list')}
                className={`p-2.5 rounded-lg transition-all ${
                  layoutMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="List View"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setLayoutMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${
                  layoutMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Bento Grid"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic League Pills Scroll Row (Only show if multiple leagues are present) */}
        {leagues.length > 2 && (
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1.5 no-scrollbar mask-gradient-x select-none">
            {leagues.map((league) => (
              <button
                key={league}
                onClick={() => setSelectedLeague(league)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all border whitespace-nowrap ${
                  selectedLeague === league
                    ? 'bg-white text-zinc-950 border-white font-bold shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 border-white/[0.05] hover:text-white hover:bg-zinc-900'
                }`}
              >
                {league === 'all' ? 'Semua Liga' : league}
              </button>
            ))}
          </div>
        )}

      </div>

      {filteredMatches.length === 0 ? (
        <div className="text-center py-20 border border-white/[0.05] rounded-3xl bg-zinc-950/40 backdrop-blur-sm">
          <Trophy className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-base font-bold text-zinc-300">Tidak ada jadwal pertandingan</h2>
          <p className="text-zinc-500 mt-1.5 text-xs max-w-xs mx-auto">
            Gagal menemukan siaran sepak bola sesuai filter yang dipilih. Silakan ubah filter atau segarkan.
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-xs font-bold px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-all"
            >
              Reset Pencarian
            </button>
          )}
        </div>
      ) : layoutMode === 'list' ? (
        
        /* 1. PROFESSIONAL SCOREBOARD ROW LIST VIEW */
        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {filteredMatches.map((match, i) => {
              const live = isLive(match);
              const start = new Date(match.startTime);

              return (
                <motion.div
                  key={match.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  transition={{ duration: 0.25, delay: i * 0.015 }}
                  className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 bg-[#0c0c0e] hover:bg-[#121216] ${
                    match.isFeatured
                      ? 'border-red-600/30 hover:border-red-600/50 shadow-[0_4px_30px_rgba(220,38,38,0.04)] bg-gradient-to-r from-[#0d0d10] via-[#0c0c0e] to-red-950/[0.04]'
                      : live 
                        ? 'border-red-500/20 hover:border-red-500/40 shadow-[0_4px_24px_rgba(239,68,68,0.02)]' 
                        : 'border-white/[0.05] hover:border-white/[0.1]'
                  }`}
                >
                  <div className="px-5 py-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    
                    {/* Left: Competition & Kickoff State */}
                    <div className="flex items-center justify-between md:justify-start gap-4 md:min-w-[170px] border-b md:border-b-0 pb-2 md:pb-0 border-white/5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 truncate max-w-[130px]">
                            {match.competition || 'Elite Match'}
                          </span>
                          {match.isFeatured && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-600 text-white flex items-center gap-0.5 shadow-sm animate-pulse">
                              🔥 Laga Hot
                            </span>
                          )}
                        </div>
                        
                        {live ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.7)]"></span>
                            <span className="text-[10px] font-black tracking-widest text-red-500 uppercase">LIVE</span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-zinc-400">
                            {mounted ? formatToWIB(start, 'dd MMM • HH:mm') : 'Jadwal'}
                          </span>
                        )}
                      </div>

                      {/* Right counter inside first col on mobile */}
                      <div className="md:hidden">
                        {!live ? (
                          <Countdown targetDate={start} />
                        ) : (
                          <Link 
                            href={`/live/${match.id}`}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all inline-flex items-center space-x-1"
                          >
                            <PlayCircle className="w-3.5 h-3.5" /> <span>Tonton Live</span>
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Middle: Professional Club Faceoff Row */}
                    <div className="flex-1 grid grid-cols-11 items-center max-w-2xl">
                      
                      {/* Home Club */}
                      <div className="col-span-5 flex items-center justify-end space-x-3 text-right">
                        <span className="text-sm font-extrabold text-zinc-100 group-hover:text-white tracking-tight truncate w-full select-none">
                          {match.homeTeam}
                        </span>
                        <div className="shrink-0">
                          {match.homeLogo ? (
                            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden p-1 shadow-inner group-hover:scale-105 duration-200">
                              <img 
                                src={match.homeLogo} 
                                alt={match.homeTeam}
                                className="w-full h-full object-contain"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            </div>
                          ) : (
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getTeamGradient(match.homeTeam)} flex items-center justify-center font-extrabold text-white text-[11px] border border-white/10 shadow-sm group-hover:scale-105 duration-200`}>
                              {getTeamInitials(match.homeTeam)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Score / VS Center Area */}
                      <div className="col-span-1 flex flex-col items-center justify-center select-none font-black text-xs text-zinc-600">
                        {live ? (
                          <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] px-2 py-0.5 rounded font-black tracking-widest animate-pulse">VS</span>
                        ) : (
                          <span className="text-[10px] hover:text-zinc-400 bg-white/5 border border-white/5 px-2 py-1 rounded-md">VS</span>
                        )}
                      </div>

                      {/* Away Club */}
                      <div className="col-span-5 flex items-center justify-start space-x-3 text-left">
                        <div className="shrink-0">
                          {match.awayLogo ? (
                            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden p-1 shadow-inner group-hover:scale-105 duration-200">
                              <img 
                                src={match.awayLogo} 
                                alt={match.awayTeam}
                                className="w-full h-full object-contain"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            </div>
                          ) : (
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getTeamGradient(match.awayTeam)} flex items-center justify-center font-extrabold text-white text-[11px] border border-white/10 shadow-sm group-hover:scale-105 duration-200`}>
                              {getTeamInitials(match.awayTeam)}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-extrabold text-zinc-100 group-hover:text-white tracking-tight truncate w-full select-none">
                          {match.awayTeam}
                        </span>
                      </div>

                    </div>

                    {/* Right: CTA Button or Countdown for Tablet/Desktop */}
                    <div className="hidden md:flex items-center justify-end min-w-[150px] shrink-0">
                      {!live ? (
                        <Countdown targetDate={start} />
                      ) : (
                        <Link 
                          href={`/live/${match.id}`}
                          className="bg-white hover:bg-zinc-200 text-black rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all duration-200 hover:scale-[1.03] shadow-md flex items-center space-x-1.5"
                        >
                          <PlayCircle className="w-4 h-4 text-red-600 animate-pulse" />
                          <span>Tonton Live</span>
                        </Link>
                      )}
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        
        /* 2. BENTO CARDS GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
          <AnimatePresence mode="popLayout">
            {filteredMatches.map((match, i) => {
              const live = isLive(match);
              const start = new Date(match.startTime);

              return (
                <motion.div 
                  key={match.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: 'easeOut', delay: i * 0.015 }}
                  className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                    match.isFeatured
                      ? 'bg-gradient-to-b from-[#0d0d10] to-[#0c0c0e] border-red-600/30 hover:border-red-600/50 shadow-[0_4px_35px_rgba(220,38,38,0.05)]'
                      : live 
                        ? 'bg-zinc-950/60 border-red-500/20 hover:border-red-500/40 shadow-[0_4px_30px_rgba(239,68,68,0.03)]' 
                        : 'bg-[#0c0c0e]/80 border-white/[0.05] hover:border-white/[0.1] shadow-xl'
                  }`}
                >
                  <div className="p-6 flex flex-col h-full justify-between gap-5">
                    
                    {/* Header Group */}
                    <div className="flex items-center justify-between gap-2 overflow-hidden">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400 bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg truncate">
                          {match.competition || 'Football SPECIAL'}
                        </span>
                        {match.isFeatured && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-500 text-white flex items-center gap-0.5 shadow-md shadow-red-900/30 animate-pulse shrink-0">
                            🔥 Hot
                          </span>
                        )}
                      </div>
                      {live ? (
                        <span className="flex items-center text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full select-none">
                          <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5 animate-pulse"></span>
                          Live
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/25 border border-cyan-500/10 px-2.5 py-0.5 rounded-full">
                          Jadwal
                        </span>
                      )}
                    </div>

                    {/* Clubs Faceoff Frame */}
                    <div className="flex flex-col space-y-4 py-1">
                      {/* Home */}
                      <div className="flex items-center space-x-3.5">
                        {match.homeLogo ? (
                          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-inner p-1 group-hover:scale-105 duration-200">
                            <img 
                              src={match.homeLogo} 
                              alt={match.homeTeam}
                              className="w-full h-full object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          </div>
                        ) : (
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getTeamGradient(match.homeTeam)} flex items-center justify-center font-extrabold text-white text-xs border border-white/10 shrink-0 shadow-md group-hover:scale-105 duration-200`}>
                            {getTeamInitials(match.homeTeam)}
                          </div>
                        )}
                        <span className="text-base font-extrabold tracking-tight text-white group-hover:text-zinc-200 transition-colors truncate">
                          {match.homeTeam}
                        </span>
                      </div>
                      
                      {/* VS separator decoration */}
                      <div className="flex items-center px-1">
                        <div className="h-[1px] bg-white/[0.04] flex-1"></div>
                        <span className="text-[9px] font-black tracking-widest text-zinc-600 uppercase mx-3">VS</span>
                        <div className="h-[1px] bg-white/[0.04] flex-1"></div>
                      </div>

                      {/* Away */}
                      <div className="flex items-center space-x-3.5">
                        {match.awayLogo ? (
                          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-inner p-1 group-hover:scale-105 duration-200">
                            <img 
                              src={match.awayLogo} 
                              alt={match.awayTeam}
                              className="w-full h-full object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          </div>
                        ) : (
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getTeamGradient(match.awayTeam)} flex items-center justify-center font-extrabold text-white text-xs border border-white/10 shrink-0 shadow-md group-hover:scale-105 duration-200`}>
                            {getTeamInitials(match.awayTeam)}
                          </div>
                        )}
                        <span className="text-base font-extrabold tracking-tight text-white group-hover:text-zinc-200 transition-colors truncate">
                          {match.awayTeam}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between mt-auto">
                      {!live ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
                          <div className="text-zinc-400 flex flex-col">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">Kickoff Jadwal</span>
                            <span className="text-xs font-semibold text-zinc-300">
                              {mounted ? formatToWIB(start, 'dd MMM • HH:mm') : 'Loading...'}
                            </span>
                          </div>
                          <div className="shrink-0 flex items-center justify-end">
                            <Countdown targetDate={start} />
                          </div>
                        </div>
                      ) : (
                        <Link 
                          href={`/live/${match.id}`}
                          className="w-full flex items-center justify-center space-x-2 bg-white text-black hover:bg-zinc-200 font-extrabold py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:scale-[1.01] active:scale-[0.99]"
                        >
                          <PlayCircle className="w-4 h-4 text-red-600 animate-pulse" />
                          <span>Tonton Live Sekarang</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
