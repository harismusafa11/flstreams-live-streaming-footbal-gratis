import Link from 'next/link';

export default async function Navbar() {
  let liveCount = 0;
  try {
    const res = await fetch('https://streamfree.top/api/v1/streams', {
      next: { revalidate: 30 },
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (res.ok) {
      const data = await res.json();
      const nowSec = Math.floor(Date.now() / 1000);
      const fiveHoursAgo = nowSec - 5 * 3600;
      liveCount = (data.streams || []).filter((m: Record<string, unknown>) => typeof m.match_timestamp === 'number' && m.match_timestamp <= nowSec && m.match_timestamp >= fiveHoursAgo).length;
    }
  } catch {
    // silently fallback to 0 or previous cached value
  }

  return (
    <header className="sticky top-0 z-50 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80">
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between"
        aria-label="Navigasi utama"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="FL Streams — Beranda"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="FL Streams Logo"
            className="w-9 h-9 object-contain rounded-lg border border-slate-800/80 group-hover:border-emerald-500/40 transition-colors"
          />
          <div className="flex flex-col">
            <span className="font-black text-base tracking-wider leading-none text-slate-100 uppercase">
              FL<span className="text-emerald-400"> STREAMS</span>
            </span>
            <span className="text-[9px] text-slate-500 font-bold tracking-widest mt-1">
              WWW.FLSTREAMS.MY.ID
            </span>
          </div>
        </Link>

        {/* Live stats */}
        <div className="flex items-center gap-3 text-[11px] sm:text-xs font-semibold">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span>{liveCount > 0 ? `${liveCount} Streams Live` : 'Live Streams'}</span>
          </div>
        </div>
      </nav>
    </header>
  );
}
