import type { Metadata } from 'next';
import Script from 'next/script';
import { satoshi } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Noctra SEO',
  description: 'Plataforma de inteligencia SEO y GEO para agencias y SMBs',
  icons: {
    icon: [
      { url: '/favicon-dark.svg', media: '(prefers-color-scheme: light)' },
      { url: '/favicon-light.svg', media: '(prefers-color-scheme: dark)' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${satoshi.variable} scroll-smooth`}>
      <body className="min-h-screen bg-[#0A0A0F] text-[#F1F1F5] antialiased">
        <Script
          src="https://cdn.noctra.studio/tracker.js"
          data-site-id="47dbb728b34b4ea5b801daa6105a5946"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
