import './globals.css';
import type { Metadata } from 'next';
import { Archivo, Inter, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';

// Both fonts exposed as CSS variables for the DESIGN.md token fonts
// (font-sans / font-mono). Page chrome lives in each route tree: the Phase 1
// screens use components/ds/AppShell; /picks keeps the legacy look until the
// Phase 2 review (TASKS.md 1.10).
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });
// Display face from the approved "Broadcast dark" direction (design canvas)
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['600', '700', '900'],
  variable: '--font-archivo',
});

export const generateViewport = () => {
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#0B0F1A',
  };
};

export const metadata: Metadata = {
  metadataBase: new URL('https://fplanalytic.com'),
  title: 'fplanalytic: Defensive Contribution, decoded.',
  description: 'Hit rates, live threshold tracking and value. Built for the DEFCON era.',
  icons: {
    icon: '/favicon.ico',
  },
};

// Runs before first paint so a returning light-mode visitor never sees a dark
// flash (and vice versa). Dark is the default; system preference decides for
// first-time visitors; ds/ThemeToggle writes fpla_theme.
const THEME_INIT = `try {
  var t = localStorage.getItem('fpla_theme');
  if (!t) t = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
  if (t === 'light') {
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', '#F5F6F8');
  }
} catch (e) {}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${archivo.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className={`${inter.className} min-h-screen antialiased`}>
        {children}
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <Script
            src="https://cloud.umami.is/script.js"
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
