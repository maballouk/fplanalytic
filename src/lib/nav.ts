// Primary navigation (DESIGN.md §2 AppShell), grouped by GAME so nobody has
// to guess which competition a screen serves. The legacy /picks dashboard is
// deliberately unlisted (reachable by URL until the Phase 2 review, TASKS 1.10).

export interface NavItem {
  href: string;
  label: string;
  premium?: boolean;
  /** Game group label; rendered once before the group's first item */
  group?: string;
}

export const NAV: NavItem[] = [
  { href: '/', label: 'DEFCON', group: 'FPL' },
  { href: '/live', label: 'Live', group: 'FPL' },
  { href: '/value', label: 'Value', group: 'FPL' },
  { href: '/ucl', label: 'European Nights', group: 'UCL Fantasy' },
  { href: '/methodology', label: 'Methodology' },
];
