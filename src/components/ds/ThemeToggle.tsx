'use client';

// Dark / light switch (2026-09-14). The inline script in layout.tsx sets
// data-theme before first paint; this button only flips it afterwards and
// remembers the choice. Dark stays the brand default.

import { useEffect, useState } from 'react';
import { track } from '@/lib/analytics';

const STORAGE_KEY = 'fpla_theme';

function applyTheme(theme: 'dark' | 'light') {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'light' ? '#F5F6F8' : '#0B0F1A');
}

export default function ThemeToggle() {
  // null until mounted: the server cannot know the visitor's theme
  const [theme, setTheme] = useState<'dark' | 'light' | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  }, []);

  const flip = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // fine: it just will not persist
    }
    track('theme_toggle', { theme: next });
  };

  return (
    <button
      onClick={flip}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      title={theme === 'light' ? 'Dark mode' : 'Light mode'}
      className="flex h-8 w-8 items-center justify-center rounded-pill border border-line bg-bg-raised text-text-muted transition-colors duration-hover hover:bg-bg-overlay hover:text-text"
    >
      {theme === 'light' ? (
        // moon
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        // sun
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4.2" strokeWidth="1.8" />
          <path
            d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
