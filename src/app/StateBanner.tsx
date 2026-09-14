'use client';

// The state-aware layer of the home page (canvas-approved flow). The brief is
// always the base; this banner adds the moment on top:
//   deadline (<24h): amber countdown bar
//   live: the +2 ticker, fed by /api/defcon/live
//   review (48h after a finished GW): the +2 ledger
// State logic lives in lib/defcon/brief.ts and is unit-tested.

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import PlayerAvatar from '@/components/ds/PlayerAvatar';
import ThresholdBar from '@/components/ds/ThresholdBar';
import { inLiveWindow, pickState, type HomeState, type ReviewLedger } from '@/lib/defcon/brief';
import { thresholdFor, type Calendar } from '@/lib/defcon/file';
import type { LivePayload } from '@/lib/defcon/live';
import { playerPhotoUrl } from '@/lib/fpl/photos';

function useCountdown(deadlineIso: string): string {
  const [text, setText] = useState('');
  useEffect(() => {
    const tick = () => {
      const ms = Date.parse(deadlineIso) - Date.now();
      if (ms <= 0) {
        setText('00:00:00');
        return;
      }
      const d = Math.floor(ms / 86_400_000);
      const h = Math.floor((ms % 86_400_000) / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      const s = Math.floor((ms % 60_000) / 1000);
      const pad = (x: number) => String(x).padStart(2, '0');
      setText(d > 0 ? `${d}d ${pad(h)}:${pad(m)}` : `${pad(h)}:${pad(m)}:${pad(s)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineIso]);
  return text;
}

export default function StateBanner({
  calendar,
  ledger,
}: {
  calendar?: Calendar;
  ledger: ReviewLedger;
}) {
  const [live, setLive] = useState<LivePayload | null>(null);
  const [state, setState] = useState<HomeState>('planning');

  const evaluate = useCallback(async () => {
    const now = Date.now();
    let payload: LivePayload | null = null;
    if (inLiveWindow(calendar, now)) {
      try {
        const res = await fetch('/api/defcon/live');
        if (res.ok) payload = (await res.json()) as LivePayload;
      } catch {
        // live check is best-effort; the calendar states still work
      }
    }
    const liveActive = (payload?.fixtures ?? []).some((f) => !f.finished);
    setLive(liveActive ? payload : null);
    setState(pickState(calendar, now, liveActive));
  }, [calendar]);

  useEffect(() => {
    evaluate();
    const id = setInterval(evaluate, 5 * 60_000);
    return () => clearInterval(id);
  }, [evaluate]);

  const countdown = useCountdown(calendar?.next_deadline ?? new Date().toISOString());

  if (state === 'deadline' && calendar) {
    return (
      <div className="border-b border-warn/25 bg-gradient-to-r from-tint-warn to-bg">
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-3 px-5 py-3">
          <span className="text-sm font-semibold text-warn">
            GW{calendar.next_gw ?? ''} deadline in <span className="num text-lg">{countdown}</span>
          </span>
          <Link
            href="/"
            className="rounded-pill border border-warn/40 px-4 py-1 text-sm text-warn transition-colors duration-hover hover:bg-bg-overlay"
          >
            Final checks below
          </Link>
        </div>
      </div>
    );
  }

  if (state === 'live' && live) {
    const closest = live.players.slice(0, 3);
    return (
      <div className="border-b border-accent/20 bg-gradient-to-r from-tint-accent to-bg">
        <div className="mx-auto max-w-content px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-accent">
              <span className="inline-block h-1.5 w-1.5 rounded-pill bg-accent" />
              Closest to the +2 right now
            </span>
            <Link href="/live" className="text-sm text-info hover:underline">
              Open Matchday live
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {closest.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-card border border-line bg-bg-raised px-3 py-2"
              >
                <span className="truncate text-sm">
                  {p.name}
                  <span className="ml-1.5 text-xs text-text-faint">{p.team}</span>
                </span>
                <div className="ml-auto w-28">
                  <ThresholdBar
                    actions={p.actions}
                    threshold={p.threshold}
                    label={`${p.name}: ${p.actions} of ${p.threshold} defensive actions`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (state === 'review' && (ledger.banked.length > 0 || ledger.nearMissed.length > 0)) {
    return (
      <div className="border-b border-line bg-gradient-to-r from-tint-info to-bg">
        <div className="mx-auto max-w-content px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-text">
              GW{calendar?.gw} full time: the +2 ledger
            </span>
            <span className="text-xs text-text-faint">
              Players who keep landing one short are buys, not duds
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ul className="space-y-1.5">
              {ledger.banked.map(({ player, actions }) => (
                <li key={player.player_id} className="flex items-center gap-2.5 text-sm">
                  <PlayerAvatar src={playerPhotoUrl(player.code)} name={player.name} size={24} />
                  {player.name}
                  <span className="text-xs text-text-faint">{player.team}</span>
                  <span className="num ml-auto text-accent">{actions} actions</span>
                </li>
              ))}
            </ul>
            <ul className="space-y-1.5">
              {ledger.nearMissed.map(({ player, actions }) => (
                <li key={player.player_id} className="flex items-center gap-2.5 text-sm">
                  <PlayerAvatar src={playerPhotoUrl(player.code)} name={player.name} size={24} />
                  {player.name}
                  <span className="text-xs text-text-faint">{player.team}</span>
                  <span className="num ml-auto text-warn">
                    missed by {Math.max(1, thresholdFor(player.position) - actions)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
