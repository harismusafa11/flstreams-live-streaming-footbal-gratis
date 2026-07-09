import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'FL Streams - Live Streaming Gratis Sepak Bola',
  description: 'FL Streams menyediakan jadwal live streaming sepak bola gratis, link siaran langsung bola hari ini, dan embed pertandingan olahraga yang diperbarui setiap hari.',
  keywords: [
    'FL Streams',
    'live streaming gratis',
    'live streaming bola',
    'streaming sepak bola gratis',
    'nonton bola online',
    'jadwal bola hari ini',
    'siaran langsung sepak bola',
    'link live streaming bola',
    'streaming bola tanpa bayar',
    'live match football',
    'nonton pertandingan bola',
    'streaming olahraga gratis',
  ],
  metadataBase: new URL('https://www.flstreams.my.id'),
  openGraph: {
    siteName: 'FL Streams',
    type: 'website',
    locale: 'id_ID',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
  verification: {
    google: 'adVNAT7PjGq7dJJbIR7GlHLhvLsSbcb8a3nZAjSLIg0',
    yandex: '41aee8e803292b1d',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${geist.variable} h-full`}>
      <body className="min-h-full antialiased bg-[#090d16] text-slate-200">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
