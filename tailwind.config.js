/** @type {import('tailwindcss').Config} */
// Design tokens from docs/DESIGN.md §1 (dark / sporty-premium). The legacy
// premier-league-* colours and light-theme extras below them are kept only
// until Phase 1 replaces the current screens (TASKS.md 1.3-1.4, 1.10).
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // DESIGN.md §1 tokens
        bg: { DEFAULT: '#0B0F1A', raised: '#111827', overlay: '#161E2E' }, // page, card, popover
        line: { DEFAULT: '#1F2937', strong: '#374151' }, // borders/dividers
        text: { DEFAULT: '#E5E7EB', muted: '#9CA3AF', faint: '#6B7280' },
        accent: { DEFAULT: '#00FF87', dim: '#00C96B' }, // "good" signals only, never decoration
        warn: '#FBBF24', // rotation risk, near-miss
        danger: '#F87171', // sell / injured / red card
        info: '#60A5FA', // neutral highlight, links
        premium: '#C084FC', // premium-only badges and locks
        // Legacy (current live screens; remove at Phase 2 review per 1.10)
        'premier-league-purple': '#37003c',
        'premier-league-green': '#00ff87',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
        display: ['var(--font-archivo)', 'Archivo', 'Inter', 'sans-serif'],
      },
      fontSize: {
        // DESIGN.md type scale
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['14px', { lineHeight: '1.5' }],
        base: ['15px', { lineHeight: '1.5' }],
        lg: ['18px', { lineHeight: '1.5' }],
        xl: ['22px', { lineHeight: '1.4' }],
        '2xl': ['28px', { lineHeight: '1.3' }],
        '3xl': ['36px', { lineHeight: '1.2' }],
        // Legacy
        xxs: '0.625rem',
      },
      borderRadius: {
        card: '14px',
        pill: '999px',
        // Legacy
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        // DESIGN.md card shadow (dark). The legacy light-card hover shadow stays
        // under its own key until the old screens are replaced.
        card: '0 1px 0 0 #1F2937 inset, 0 10px 30px -18px rgba(0,0,0,.8)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      maxWidth: {
        content: '1200px',
        // Legacy
        '7xl': '80rem',
        '8xl': '88rem',
        '9xl': '96rem',
      },
      transitionDuration: {
        hover: '150ms',
        panel: '250ms',
        // Legacy
        400: '400ms',
      },
      spacing: {
        72: '18rem',
        84: '21rem',
        96: '24rem',
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
    },
  },
  plugins: [],
}
