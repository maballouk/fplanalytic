import { notFound } from 'next/navigation'

// Dev-only token gallery (TASKS.md 0.4). Renders every design token and a stub
// per DESIGN.md §2 component so visual drift is caught early. Hidden in production.
// Wrapped in its own dark surface: the site shell is still the legacy light theme
// until Phase 1 replaces it.

const COLOR_TOKENS: { name: string; cls: string; hex: string }[] = [
  { name: 'bg', cls: 'bg-bg', hex: '#0B0F1A' },
  { name: 'bg.raised', cls: 'bg-bg-raised', hex: '#111827' },
  { name: 'bg.overlay', cls: 'bg-bg-overlay', hex: '#161E2E' },
  { name: 'line', cls: 'bg-line', hex: '#1F2937' },
  { name: 'line.strong', cls: 'bg-line-strong', hex: '#374151' },
  { name: 'text', cls: 'bg-text', hex: '#E5E7EB' },
  { name: 'text.muted', cls: 'bg-text-muted', hex: '#9CA3AF' },
  { name: 'text.faint', cls: 'bg-text-faint', hex: '#6B7280' },
  { name: 'accent', cls: 'bg-accent', hex: '#00FF87' },
  { name: 'accent.dim', cls: 'bg-accent-dim', hex: '#00C96B' },
  { name: 'warn', cls: 'bg-warn', hex: '#FBBF24' },
  { name: 'danger', cls: 'bg-danger', hex: '#F87171' },
  { name: 'info', cls: 'bg-info', hex: '#60A5FA' },
  { name: 'premium', cls: 'bg-premium', hex: '#C084FC' },
]

const TYPE_SCALE = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl']

const COMPONENT_STUBS = [
  'AppShell',
  'StatCard',
  'PlayerRow',
  'PlayerDrawer',
  'ThresholdBar',
  'FixtureStrip',
  'RankBadge',
  'PremiumLock',
  'MethodNote',
  'EmptyState',
  'SegmentedTabs',
]

export default function DesignPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <div className="min-h-screen bg-bg font-sans text-base font-normal text-text">
      <main className="mx-auto max-w-content space-y-8 px-5 py-10">
        <h1 className="text-2xl font-semibold">Design tokens</h1>

        <section>
          <h2 className="mb-4 text-lg font-normal text-text-muted">Colours</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {COLOR_TOKENS.map((t) => (
              <div key={t.name} className="rounded-card border border-line bg-bg-raised p-3">
                <div className={`h-10 rounded-card border border-line ${t.cls}`} />
                <div className="mt-2 text-sm">{t.name}</div>
                <div className="num text-xs text-text-faint">{t.hex}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-normal text-text-muted">
            Type scale (Inter / JetBrains Mono)
          </h2>
          <div className="space-y-2 rounded-card border border-line bg-bg-raised p-5 shadow-card">
            {TYPE_SCALE.map((cls) => (
              <p key={cls} className={cls}>
                {cls} · Defensive Contribution, decoded.
              </p>
            ))}
            <p className="num text-xl">0123456789 · mono tabular for all table numbers</p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-normal text-text-muted">Surfaces, radius, shadow</h2>
          <div className="flex flex-wrap gap-4">
            <div className="rounded-card border border-line bg-bg-raised p-5 shadow-card">
              card · radius 14px · shadow.card
            </div>
            <span className="self-center rounded-pill border border-line-strong bg-bg-overlay px-4 py-1 text-sm">
              pill · radius 999px
            </span>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-normal text-text-muted">
            Component stubs (built in Phase 1, task 1.3)
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {COMPONENT_STUBS.map((name) => (
              <div
                key={name}
                className="rounded-card border border-dashed border-line-strong bg-bg-raised p-5 text-center text-sm text-text-muted"
              >
                {name}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
