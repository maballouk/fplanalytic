import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';

// Both fonts exposed as CSS variables for the DESIGN.md token fonts
// (font-sans / font-mono). Page chrome lives in each route tree: the Phase 1
// screens use components/ds/AppShell; /picks keeps the legacy look until the
// Phase 2 review (TASKS.md 1.10).
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });

export const generateViewport = () => {
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#0B0F1A',
  };
};

export const metadata: Metadata = {
  title: 'fplanalytic: Defensive Contribution, decoded.',
  description: 'Hit rates, live threshold tracking and value. Built for the DEFCON era.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className={`${inter.className} min-h-screen antialiased`}>{children}</body>
    </html>
  );
}
