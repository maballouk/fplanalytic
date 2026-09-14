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
        // DESIGN.md §1 tokens — CSS variables since light mode (2026-09-14);
        // the actual values live in globals.css (:root dark, [data-theme=light]).
        bg: {
          DEFAULT: 'rgb(var(--bg) / <alpha-value>)',
          raised: 'rgb(var(--bg-raised) / <alpha-value>)',
          overlay: 'rgb(var(--bg-overlay) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--line) / <alpha-value>)',
          strong: 'rgb(var(--line-strong) / <alpha-value>)',
        },
        text: {
          DEFAULT: 'rgb(var(--text) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
          faint: 'rgb(var(--text-faint) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          dim: 'rgb(var(--accent-dim) / <alpha-value>)',
        }, // "good" signals only, never decoration
        warn: 'rgb(var(--warn) / <alpha-value>)', // rotation risk, near-miss
        danger: 'rgb(var(--danger) / <alpha-value>)', // sell / injured / red card
        info: 'rgb(var(--info) / <alpha-value>)', // neutral highlight, links
        premium: 'rgb(var(--premium) / <alpha-value>)', // premium-only badges and locks
        // Tinted panel backgrounds + text on accent-filled controls (light mode)
        tint: {
          accent: 'rgb(var(--tint-accent) / <alpha-value>)',
          info: 'rgb(var(--tint-info) / <alpha-value>)',
          danger: 'rgb(var(--tint-danger) / <alpha-value>)',
          warn: 'rgb(var(--tint-warn) / <alpha-value>)',
        },
        'on-accent': 'rgb(var(--on-accent) / <alpha-value>)',
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
        card: 'var(--shadow-card)',
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
};
