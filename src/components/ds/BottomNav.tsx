// App-style bottom navigation, mobile only (DESIGN.md §2 extension approved
// 2026-09-14 "look & feel" round). Five slots max; icons are inline SVG.

import Link from 'next/link';
import LiveDot from './LiveDot';

export interface BottomNavItem {
  href: string;
  label: string;
  icon: 'shield' | 'pulse' | 'shirt' | 'star' | 'scatter';
}

const ICONS: Record<BottomNavItem['icon'], React.ReactNode> = {
  shield: (
    <path
      d="M12 3l7 3v5c0 4.5-3 8.2-7 9.5C8 19.2 5 15.5 5 11V6l7-3z"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  ),
  pulse: (
    <path
      d="M3 12h4l2.5-6 4 12L16 12h5"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  shirt: (
    <path
      d="M8 4l4 2 4-2 4 4-2.5 2.5V20h-11V8.5L4 8l4-4z"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  ),
  star: (
    <path
      d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 5.9L12 16.4l-5.3 2.9 1.2-5.9L3.4 9.3l6-.7L12 3z"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  ),
  scatter: (
    <>
      <circle cx="6" cy="16" r="1.8" strokeWidth="1.7" />
      <circle cx="12" cy="9" r="1.8" strokeWidth="1.7" />
      <circle cx="18" cy="14" r="1.8" strokeWidth="1.7" />
      <path d="M4 20h16" strokeWidth="1.7" strokeLinecap="round" />
    </>
  ),
};

export default function BottomNav({
  items,
  activeHref,
}: {
  items: readonly BottomNavItem[];
  activeHref?: string;
}) {
  return (
    <nav
      aria-label="Primary, compact"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex">
        {items.map((item) => {
          const active = item.href === activeHref;
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors duration-hover ${
                  active ? 'text-accent' : 'text-text-muted'
                }`}
              >
                <span className="relative">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    {ICONS[item.icon]}
                  </svg>
                  {item.href === '/live' && <LiveDot />}
                </span>
                <span className="max-w-full truncate px-1">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
