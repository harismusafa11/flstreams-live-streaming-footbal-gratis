// app/page.tsx
import { getSupabaseAdmin } from '@/lib/supabase';
import MatchesView from '@/components/MatchesView';
import Link from 'next/link';
import Image from 'next/image';
import { Tv, ShieldCheck, Activity, Flame, Zap, Award, Heart, Server } from 'lucide-react';
import { SponsorBanner } from '@/components/SponsorBanner';
import { autoUpdateMatchStatuses } from '@/lib/match-updater';

// force-dynamic = render on every request, skip build-time static prerendering
export const dynamic = 'force-dynamic';


export default async function HomePage() {
  // Jalankan auto-update status pertandingan sesuai jadwal sebelum mengambil data
  await autoUpdateMatchStatuses();

  const { data: matches } = await getSupabaseAdmin()
    .from('matches')
    .select('*')
    .neq('status', 'COMPLETED')
    .order('isFeatured', { ascending: false })
    .order('startTime', { ascending: true });

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-150 selection:bg-red-600/30 selection:text-white">
      
      {/* Subtle background ambient mesh glow */}
      <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-emerald-500/5 rounded-full pointer-events-none blur-[120px]" />
      <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full pointer-events-none blur-[160px]" />

      {/* Glassmorphic Live Broadcaster Header */}
      <header className="border-b border-white/[0.05] bg-[#070709]/80 backdrop-blur-md px-6 py-4 fixed top-0 w-full z-20 transition-all duration-300">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-red-600/10 transition-transform group-hover:scale-105 duration-200">
              <Image 
                src="https://ml5dafx6yq9i.i.optimole.com/w:auto/h:auto/q:auto/id:4f5fe1b69ca5191416e0e459d2f19f01/directUpload/ChatGPT_Image_Jun_23__2026__10_26_40_PM.png" 
                alt="FL Streams Logo" 
                width={36} 
                height={36} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-black tracking-tight text-white leading-none">
                FL <span className="text-red-500">STREAMS</span>
              </h1>
              <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase mt-0.5">Broadcaster</span>
            </div>
          </Link>

          {/* Quick Header Nav */}
          <nav className="flex items-center space-x-6">
            <Link 
              href="/" 
              className="text-xs font-black uppercase tracking-wider text-white hover:text-red-500 transition-colors"
            >
              Beranda
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto pt-28 pb-20 px-4 sm:px-6 relative z-10">

        {/* Dynamic Custom Third-Party Sponsor Billboard Banner */}
        <div className="w-full max-w-4xl mx-auto flex justify-center mb-6">
          <SponsorBanner slot="bottom" width={728} height={90} label="Sponsor Hubungi Kami" />
        </div>

        {/* Server Maintenance Donation Callout Card */}
        <div className="w-full max-w-4xl mx-auto mb-10 p-6 rounded-2xl border border-red-500/15 bg-gradient-to-r from-[#0d0d11] via-zinc-950 to-[#0d0d11] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-red-500/[0.01] pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center text-center md:text-left flex-col md:flex-row gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0 group-hover:scale-105 transition-transform">
              <Server className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center justify-center md:justify-start gap-1.5">
                Dukung Server FL STREAMS <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full inline-block">DONASI</span>
              </h3>
              <p className="text-sm text-zinc-400 mt-1 max-w-xl leading-relaxed">
                Bantu kami merawat server agar link streaming tetap aktif, lancar tanpa buffering, dan selalu update setiap hari untuk semua penonton setia!
              </p>
            </div>
          </div>

          <a 
            href="https://sociabuzz.com/flstreams/tribe" 
            target="_blank" 
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-2 py-4 px-8 bg-red-600 hover:bg-red-500 text-white font-black text-sm tracking-wider uppercase rounded-xl shadow-lg shadow-red-600/30 transition-all duration-150 transform hover:scale-[1.03] active:scale-97 cursor-pointer w-full md:w-auto justify-center"
          >
            <Heart className="w-5 h-5 fill-white animate-bounce" /> Donasi via SociaBuzz
          </a>
        </div>

        {/* Matches Schedules & Dynamic Stream Live List Wrapper */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2 text-zinc-500 mb-2">
            <Activity className="w-4 h-4 text-zinc-400 animate-pulse" />
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Jadwal Penyiaran Terkini</h2>
          </div>
          <MatchesView initialMatches={JSON.parse(JSON.stringify(matches))} />
        </section>

      </main>

      {/* Elegant minimalist soccer footer */}
      <footer className="border-t border-white/[0.04] bg-[#070709] py-8 text-center text-xs text-zinc-650 relative z-10 selection:bg-zinc-800">
        <p className="font-medium">© 2026 FL Streams. All rights reserved.</p>
      </footer>

    </div>
  );
}
