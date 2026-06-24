import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
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
  title: 'FL Streams Free | Live Football & Sports Streaming',
  description: 'Watch live football matches for free. Schedules and embedded live streams. High quality sports broadcasting updated daily.',
  keywords: 'live football, football streaming, free soccer, sports stream, live match, FL Streams',
  authors: [{ name: 'FL Streams' }],
  robots: 'index, follow',
  openGraph: {
    title: 'FL Streams Free | Live Football Streaming',
    description: 'Watch live football matches for free. Schedules and embedded live streams.',
    url: 'https://flstreams.com',
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
    title: 'FL Streams Free | Live Football Streaming',
    description: 'Watch live football matches for free. Schedules and embedded live streams.',
    images: ['https://ml5dafx6yq9i.i.optimole.com/w:auto/h:auto/q:auto/id:4f5fe1b69ca5191416e0e459d2f19f01/directUpload/ChatGPT_Image_Jun_23__2026__10_26_40_PM.png'],
  },
  icons: {
    icon: 'https://ml5dafx6yq9i.i.optimole.com/w:auto/h:auto/q:auto/id:4f5fe1b69ca5191416e0e459d2f19f01/directUpload/ChatGPT_Image_Jun_23__2026__10_26_40_PM.png',
  },
  verification: {
    google: 'adVNAT7PjGq7dJJbIR7GlHLhvLsSbcb8a3nZAjSLIg0',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        {/* Global Adsterra Scripts Manager (Popunders, Social Bars) */}
        <AdsterraScripts />

        {/* Third-Party Custom Multi-Sponsor Management (Sidebars, Popups) */}
        <SponsorSidebars />
        <SponsorPopup />
        
        {children}
      </body>
    </html>
  );
}
