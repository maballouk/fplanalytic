// DESIGN.md §2: top nav + content container. Nav: DEFCON · Live · Value ·
// European Nights · (Premium). Sticky, blurred background. Dark-only.
// Adopted as the site shell when the Phase 1 screens replace the legacy layout.

import Link from 'next/link';

export interface AppShellProps {
  children: React.ReactNode;
  /** Brand text, e.g. "fplanalytic" */
  brand: string;
  nav: { href: string; label: string; premium?: boolean }[];
  /** Current pathname for the active state */
  activeHref?: string;
}

export default function AppShell({ children, brand, nav, activeHref }: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg font-sans text-base text-text">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-content items-center justify-between px-5 py-3">
          <Link href="/" className="text-lg font-semibold text-text">
            {brand}
          </Link>
          <nav aria-label="Primary">
            <ul className="flex items-center gap-1">
              {nav.map((item) => (
                <li key={item.href}>
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
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-content px-5 py-8">{children}</main>
    </div>
  );
}
