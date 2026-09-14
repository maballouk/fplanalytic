// DESIGN.md §2: top nav + content container, grouped by game (FPL vs UCL
// Fantasy) so each screen's competition is explicit. Sticky, blurred
// background. Dark-only. On mobile the top items collapse and BottomNav
// takes over (look & feel round, 2026-09-14).

import Link from 'next/link';
import BottomNav, { type BottomNavItem } from './BottomNav';
import DeadlineChip from './DeadlineChip';
import Logo from './Logo';

export interface AppShellNavItem {
  href: string;
  label: string;
  premium?: boolean;
  /** Game group label; rendered once before the group's first item */
  group?: string;
}

export interface AppShellProps {
  children: React.ReactNode;
  /** Brand text, e.g. "fplanalytic" */
  brand: string;
  nav: AppShellNavItem[];
  /** Current pathname for the active state */
  activeHref?: string;
  /** Compact mobile navigation; omit to hide the bottom bar */
  bottomNav?: readonly BottomNavItem[];
  /** Live countdown chip in the header, e.g. { label: "GW6", deadlineUtc } */
  deadline?: { label: string; deadlineUtc: string };
}

export default function AppShell({
  children,
  brand,
  nav,
  activeHref,
  bottomNav,
  deadline,
}: AppShellProps) {
  let lastGroup: string | undefined;
  return (
    <div className="min-h-screen bg-bg font-sans text-base text-text">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-y-1 px-5 py-3">
          <span className="flex items-center gap-3">
            <Link href="/" aria-label={brand}>
              <Logo />
            </Link>
            {deadline && <DeadlineChip label={deadline.label} deadlineUtc={deadline.deadlineUtc} />}
          </span>
          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex flex-wrap items-center gap-1">
              {nav.map((item) => {
                const showLabel = item.group !== undefined && item.group !== lastGroup;
                const divide = showLabel && lastGroup !== undefined;
                lastGroup = item.group ?? lastGroup;
                return (
                  <li key={item.href} className="flex items-center gap-1">
                    {divide && <span aria-hidden className="mx-1.5 h-4 w-px bg-line-strong" />}
                    {showLabel && (
                      <span className="px-1 text-[10px] font-semibold uppercase tracking-widest text-text-faint">
                        {item.group}
                      </span>
                    )}
                    <Link
                      href={item.href}
                      aria-current={item.href === activeHref ? 'page' : undefined}
                      className={`rounded-pill px-3 py-1 text-sm transition-colors duration-hover ${
                        item.href === activeHref
                          ? 'bg-bg-overlay text-text'
                          : item.premium
                            ? 'text-premium hover:bg-bg-overlay'
                            : 'text-text-muted hover:bg-bg-overlay hover:text-text'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>
      <main className={`mx-auto max-w-content px-5 py-8 ${bottomNav ? 'pb-24 md:pb-8' : ''}`}>
        {children}
      </main>
      {bottomNav && <BottomNav items={bottomNav} activeHref={activeHref} />}
    </div>
  );
}
