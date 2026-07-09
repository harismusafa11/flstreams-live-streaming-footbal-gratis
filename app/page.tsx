import type { Metadata } from 'next';
import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import AdsterraAd from '@/components/AdsterraAd';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'FL Streams — Live Sport Streaming Gratis',
  description:
    'Nonton pertandingan olahraga live secara gratis. Sepak bola, basket, tenis, MMA dan 20+ cabang olahraga dalam kualitas HD.',
};

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {/* Header ad */}
        <div className="my-4 flex justify-center">
          <div className="hidden md:block">
            <AdsterraAd format="banner-728x90" />
          </div>
          <div className="block md:hidden">
            <AdsterraAd format="banner-320x50" />
          </div>
        </div>

        {/* Hero */}
        <section className="py-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-100 mb-3">
            Nonton <span className="text-emerald-400">Live Sport</span> Gratis
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto text-sm">
            Stream langsung pertandingan favorit kamu — tanpa iklan berlebihan, tanpa login, tanpa biaya.
          </p>
        </section>

        {/* Client component handles all data fetching & filtering */}
        <Suspense fallback={<div className="text-center py-12 text-slate-500 font-medium animate-pulse">Memuat data pertandingan...</div>}>
          <HomeClient />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-600">
        <p>
          © 2025 FL Streams — flstreams.my.id &nbsp;·&nbsp; Dibuat untuk penggemar olahraga
        </p>
        <p className="mt-1">
          Data stream disediakan oleh pihak ketiga. FL Streams tidak meng-host konten apapun.
        </p>
      </footer>
    </>
  );
}
