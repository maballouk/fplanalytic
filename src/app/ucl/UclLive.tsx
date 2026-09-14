'use client';

// UCL Matchday live (Stadium Broadcast round, 2026-09-14): live Champions
// League scores over OUR pre-match call — the differentiation anchor. Each
// card shows the live score big, and beneath it the ghosted prediction row
// ("Model: 2.2–0.9 · most likely 2–0" with the win-prob bar). Full time adds
// the honest verdict chip: exact score hit, right winner, or missed.
// Renders nothing when no CL match is within the ±1 day window.

import { useCallback, useEffect, useRef, useState } from 'react';
import ClubBadge from '@/components/ds/ClubBadge';
import { club, uclBadgeUrl } from '@/lib/ucl/clubs';
import type { UclLiveMatch } from '@/app/api/ucl/live/route';

const POLL_MS = 60_000;
const pct = (x: number) => `${Math.round(x * 100)}%`;

function verdict(m: UclLiveMatch): { label: string; tone: string } | null {
  if (m.status !== 'finished' || !m.predicted || m.home_score === null || m.away_score === null)
    return null;
  const actual = `${m.home_score}-${m.away_score}`;
  if (m.predicted.most_likely_score === actual)
    return { label: 'Exact score called', tone: 'bg-accent/10 text-accent' };
  const sign = (h: number, a: number) => (h > a ? 'h' : h < a ? 'a' : 'd');
  const predSign =
    m.predicted.p_home > m.predicted.p_away && m.predicted.p_home > m.predicted.p_draw
      ? 'h'
      : m.predicted.p_away > m.predicted.p_home && m.predicted.p_away > m.predicted.p_draw
        ? 'a'
        : 'd';
  if (predSign === sign(m.home_score, m.away_score))
    return { label: 'Right call', tone: 'bg-accent/10 text-accent' };
  return { label: 'Model missed this one', tone: 'bg-bg-overlay text-text-muted' };
}

function StatusChip({ m }: { m: UclLiveMatch }) {
  if (m.status === 'live' || m.status === 'paused') {
    return (
      <span className="flex items-center gap-1.5 rounded-pill bg-danger/10 px-2 py-0.5 text-[11px] font-bold tracking-widest text-danger">
        <span className="h-1.5 w-1.5 animate-pulse rounded-pill bg-danger" aria-hidden />
        {m.status === 'paused' ? 'HT' : m.minute !== null ? `${m.minute}'` : 'LIVE'}
      </span>
    );
  }
  if (m.status === 'finished') {
    return (
      <span className="rounded-pill border border-line px-2 py-0.5 text-xs font-semibold text-text-faint">
        FT
      </span>
    );
  }
  return (
    <span className="num rounded-pill border border-line px-2 py-0.5 text-xs text-text-muted">
      {new Date(m.kickoff_utc).toLocaleString('en-GB', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })}
    </span>
  );
}

function LiveCard({ m, flash }: { m: UclLiveMatch; flash: boolean }) {
  const h = club(m.home);
  const a = club(m.away);
  const started = m.status !== 'upcoming';
  const v = verdict(m);
  return (
    <div className="overflow-hidden rounded-card border border-line bg-bg-raised shadow-card">
      <div
        className="h-[3px]"
        style={{
          background: `linear-gradient(90deg, ${h.color} 0%, ${h.color} 48%, ${a.color} 52%, ${a.color} 100%)`,
        }}
      />
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <ClubBadge src={uclBadgeUrl(m.home)} code={h.code} ringColor={h.color} size={26} />
            <span className="truncate font-semibold">{h.code}</span>
          </span>
          <span
            className={`num shrink-0 rounded-card px-1.5 text-2xl font-bold ${flash ? 'animate-scoreflash' : ''}`}
          >
            {started ? (
              <>
                {m.home_score ?? 0}
                <span className="mx-1 text-text-faint">–</span>
                {m.away_score ?? 0}
              </>
            ) : (
              <span className="text-base text-text-faint">v</span>
            )}
          </span>
          <span className="flex min-w-0 flex-1 items-center justify-end gap-2">
            <span className="truncate text-right font-semibold">{a.code}</span>
            <ClubBadge src={uclBadgeUrl(m.away)} code={a.code} ringColor={a.color} size={26} />
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <StatusChip m={m} />
          {v && (
            <span className={`rounded-pill px-2 py-0.5 text-xs font-semibold ${v.tone}`}>
              {v.label}
            </span>
          )}
        </div>
        {m.predicted && (
          <div className="mt-3 border-t border-line pt-2.5">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>
                Model said{' '}
                <span className="num text-text">
                  {m.predicted.xg_home.toFixed(1)}–{m.predicted.xg_away.toFixed(1)}
                </span>{' '}
                · most likely{' '}
                <span className="num text-text">
                  {m.predicted.most_likely_score.replace('-', '–')}
                </span>
              </span>
              <span className="num text-text-faint">
                {h.code} {pct(m.predicted.p_home)}
              </span>
            </div>
            <div className="mt-1.5 flex h-1.5 gap-0.5 overflow-hidden rounded-pill bg-bg opacity-70">
              <div style={{ width: pct(m.predicted.p_home) }} className="bg-accent-dim" />
              <div style={{ width: pct(m.predicted.p_draw) }} className="bg-line-strong" />
              <div style={{ width: pct(m.predicted.p_away) }} className="bg-info/40" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UclLive() {
  const [matches, setMatches] = useState<UclLiveMatch[] | null>(null);
  const [flashes, setFlashes] = useState<Set<number>>(new Set());
  const prevScores = useRef(new Map<number, string>());

  const refresh = useCallback(async () => {
    try {
      // ?preview_days=45 on /ucl previews the next matchday's cards early
      const preview = new URLSearchParams(window.location.search).get('preview_days');
      const res = await fetch(`/api/ucl/live${preview ? `?days=${preview}` : ''}`);
      if (!res.ok) return;
      const data = (await res.json()) as { matches: UclLiveMatch[] };
      const changed = new Set<number>();
      for (const m of data.matches) {
        const key = `${m.home_score}-${m.away_score}`;
        const prev = prevScores.current.get(m.id);
        if (prev !== undefined && prev !== key && m.status !== 'upcoming') changed.add(m.id);
        prevScores.current.set(m.id, key);
      }
      if (changed.size > 0) {
        setFlashes(changed);
        setTimeout(() => setFlashes(new Set()), 3000);
      }
      setMatches(data.matches);
    } catch {
      // fail-soft: the section simply stays hidden
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  if (!matches || matches.length === 0) return null;
  const anyLive = matches.some((m) => m.status === 'live' || m.status === 'paused');

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center gap-2">
        {anyLive && (
          <span className="flex items-center gap-1.5 rounded-pill bg-danger/10 px-2 py-0.5 text-[11px] font-bold tracking-widest text-danger">
            <span className="h-1.5 w-1.5 animate-pulse rounded-pill bg-danger" aria-hidden />
            LIVE
          </span>
        )}
        <h2 className="font-display text-xl font-bold">Matchday live</h2>
        <span className="ml-auto text-xs text-text-faint">Score now · what the model said</span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {matches.map((m) => (
          <LiveCard key={m.id} m={m} flash={flashes.has(m.id)} />
        ))}
      </div>
    </section>
  );
}
