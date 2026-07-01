// app/admin/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Tv, Users, Trophy, ExternalLink } from 'lucide-react';
import Image from 'next/image';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Teams Master', href: '/admin/teams', icon: Users },
    { name: 'Leagues Master', href: '/admin/leagues', icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 font-sans flex flex-col md:flex-row">
      {/* Dynamic top gradient line */}
      <div className="fixed top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 via-indigo-600 to-red-500 z-50"></div>

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 shrink-0 bg-[#0d0d12]/60 backdrop-blur-md border-r border-white/5 p-6 flex flex-col justify-between gap-8 md:sticky md:top-0 md:h-screen z-40">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-lg shadow-red-600/10 transition-transform group-hover:scale-105 duration-200">
              <Image 
                src="https://ml5dafx6yq9i.i.optimole.com/w:auto/h:auto/q:auto/id:4f5fe1b69ca5191416e0e459d2f19f01/directUpload/ChatGPT_Image_Jun_23__2026__10_26_40_PM.png" 
                alt="FL Streams Logo" 
                width={32} 
                height={32} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-black tracking-tight text-white leading-none">
                FL <span className="text-red-500">STREAMS</span>
              </h1>
              <span className="text-[8px] font-black tracking-widest text-zinc-500 uppercase mt-0.5">Admin Desk</span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-zinc-950 shadow-lg shadow-white/5'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Nav Link */}
        <div className="hidden md:block border-t border-white/5 pt-4">
          <Link
            href="/"
            className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors"
          >
            <span>Home Gateway</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pt-8 md:pt-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
