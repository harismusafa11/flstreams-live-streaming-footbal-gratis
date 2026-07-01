import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { AdsterraScripts } from '@/components/AdsterraScripts';
import { SponsorSidebars } from '@/components/SponsorSidebars';
import { SponsorPopup } from '@/components/SponsorPopup';

const inter = Inter({ subsets: ['latin'] });

// Viewport harus diexport terpisah dari metadata (Next.js 15+)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://flstreams.my.id'),
  title: {
    default: 'FL Streams - Live Streaming Gratis Sepak Bola',
    template: '%s | FL Streams',
  },
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
  authors: [{ name: 'FL Streams' }],
  creator: 'FL Streams',
  publisher: 'FL Streams',
  applicationName: 'FL Streams',
  category: 'sports',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: 'FL Streams - Live Streaming Gratis Sepak Bola',
    description: 'Nonton live streaming sepak bola gratis, cek jadwal bola hari ini, dan temukan link siaran langsung pertandingan olahraga terbaru di FL Streams.',
    url: 'https://flstreams.my.id',
    siteName: 'FL Streams',
    images: [
      {
        url: 'https://ml5dafx6yq9i.i.optimole.com/w:auto/h:auto/q:auto/id:4f5fe1b69ca5191416e0e459d2f19f01/directUpload/ChatGPT_Image_Jun_23__2026__10_26_40_PM.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FL Streams - Live Streaming Gratis Sepak Bola',
    description: 'Jadwal dan link live streaming sepak bola gratis terbaru setiap hari di FL Streams.',
    images: ['https://ml5dafx6yq9i.i.optimole.com/w:auto/h:auto/q:auto/id:4f5fe1b69ca5191416e0e459d2f19f01/directUpload/ChatGPT_Image_Jun_23__2026__10_26_40_PM.png'],
  },
  icons: {
    icon: 'https://ml5dafx6yq9i.i.optimole.com/w:auto/h:auto/q:auto/id:4f5fe1b69ca5191416e0e459d2f19f01/directUpload/ChatGPT_Image_Jun_23__2026__10_26_40_PM.png',
  },
  verification: {
    google: 'adVNAT7PjGq7dJJbIR7GlHLhvLsSbcb8a3nZAjSLIg0',
    yandex: '41aee8e803292b1d',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className} suppressHydrationWarning>
        {/* Global Adsterra Scripts Manager (Popunders, Social Bars) */}
        <AdsterraScripts />

        {/* Third-Party Custom Multi-Sponsor Management (Sidebars, Popups) */}
        <SponsorSidebars />
        <SponsorPopup />

        {children}
        <Analytics />
      </body>
    </html>
  );
}
