'use client';

// The My Team client: team-ID input (kept in localStorage, so returning is
// automatic), your XI + bench on one pitch, the DEFCON XI on the other,
// expected defensive points under each, and the single best upgrade.

import { useCallback, useEffect, useMemo, useState } from 'react';
import CountUp from '@/components/ds/CountUp';
import EmptyState from '@/components/ds/EmptyState';
import PitchFrame from '@/components/ds/PitchFrame';
import PlayerAvatar from '@/components/ds/PlayerAvatar';
import TeamBadge from '@/components/ds/TeamBadge';
import { track } from '@/lib/analytics';
import {
  bestUpgrade,
  squadPredictedTotal,
  type PredictedTeam,
  type EntryPickView,
} from '@/lib/defcon/myteam';
import type { DefconFilePlayer } from '@/lib/defcon/file';
import { playerPhotoUrl, teamBadgeUrl } from '@/lib/fpl/photos';
import { renderShareImage, type ShareSpot } from './shareImage';

const STORAGE_KEY = 'fpla_team_id';

interface EntryResponse {
  gw: number;
  entry: { id: number; team_name: string; manager: string; overall_rank: number | null };
  picks: EntryPickView[];
}

function PitchSpot({
  name,
  photo,
  xpts,
  isCaptain,
  flagged,
}: {
  name: string;
  photo: string;
  xpts: number | null;
  isCaptain?: boolean;
  flagged?: boolean;
}) {
  return (
    <div className="flex w-[4.6rem] flex-col items-center gap-1 text-center">
      <div className="relative">
        <PlayerAvatar
          src={photo}
          name={name}
          size={48}
          ringColor={flagged ? '#F87171' : '#374151'}
        />
        {isCaptain && (
          <span
            className="num absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-pill bg-accent text-[11px] font-bold text-on-accent"
            title="Captain"
          >
            C
          </span>
        )}
      </div>
      <span className="w-full truncate rounded-pill bg-bg/80 px-1.5 py-0.5 text-xs font-medium text-text">
        {name}
      </span>
      <span className={`num text-[11px] ${xpts === null ? 'text-text-faint' : 'text-accent'}`}>
        {xpts === null ? '—' : xpts.toFixed(1)}
      </span>
    </div>
  );
}

export default function MyTeam({
  players,
  defconTeam,
}: {
  players: DefconFilePlayer[];
  defconTeam: PredictedTeam | null;
}) {
  const [teamId, setTeamId] = useState('');
  const [input, setInput] = useState('');
  const [data, setData] = useState<EntryResponse | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'error' | 'notfound' | 'ready'>('idle');

  const byElementId = useMemo(() => new Map(players.map((p) => [p.player_id, p])), [players]);

  const load = useCallback(async (id: string) => {
    setState('loading');
    try {
      const res = await fetch(`/api/fpl/entry/${id}`);
      if (res.status === 404) {
        setState('notfound');
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as EntryResponse);
      setState('ready');
      track('my_team_load');
    } catch {
      setState('error');
    }
  }, []);

  // The "login" trigger: a saved ID loads the squad on every visit.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setTeamId(saved);
        setInput(saved);
        load(saved);
      }
    } catch {
      // storage unavailable: manual entry still works
    }
  }, [load]);

  const save = (id: string) => {
    const clean = id.trim();
    if (!/^\d{1,10}$/.test(clean)) return;
    setTeamId(clean);
    try {
      localStorage.setItem(STORAGE_KEY, clean);
    } catch {
      // fine: it just will not persist
    }
    load(clean);
  };

  const starters = (data?.picks ?? []).filter((p) => p.pick_position <= 11);
  const bench = (data?.picks ?? []).filter((p) => p.pick_position > 11);
  const rows = (['GKP', 'DEF', 'MID', 'FWD'] as const).map((pos) =>
    starters.filter((p) => p.position === pos)
  );
  const myTotal = data ? squadPredictedTotal(data.picks, byElementId) : 0;
  const upgrade = data ? bestUpgrade(data.picks, byElementId, players) : null;

  const [sharing, setSharing] = useState(false);
  const share = async () => {
    if (!data || sharing) return;
    setSharing(true);
    try {
      const spot = (p: EntryPickView): ShareSpot => ({
        name: p.name,
        pts: byElementId.get(String(p.id))?.xpts_total ?? null,
        captain: p.is_captain,
      });
      const blob = await renderShareImage({
        teamName: data.entry.team_name,
        gw: data.gw,
        myTotal,
        myRows: rows.map((r) => r.map(spot)),
        toolTotal: defconTeam?.total ?? null,
        toolFormation: defconTeam?.formation ?? null,
        toolRows: defconTeam
          ? [[defconTeam.gk], defconTeam.def, defconTeam.mid, defconTeam.fwd].map((r) =>
              r.map((p) => ({ name: p.name, pts: p.xpts_total }))
            )
          : [],
        upgrade: upgrade
          ? `${upgrade.out.name} → ${upgrade.in.name} (+${upgrade.gain.toFixed(1)})`
          : null,
      });
      track('share_image');
      const file = new File([blob], `fplanalytic-gw${data.gw}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My FPL team, predicted' });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // an aborted native share sheet lands here too: nothing to clean up
    } finally {
      setSharing(false);
    }
  };

  return (
    <div>
      <form
        className="mb-6 flex flex-wrap items-center gap-3 rounded-card border border-dashed border-line-strong bg-bg-raised p-4"
        onSubmit={(e) => {
          e.preventDefault();
          save(input);
        }}
      >
        <label htmlFor="team-id" className="text-sm text-text-muted">
          Your FPL team ID
        </label>
        <input
          id="team-id"
          name="team_id"
          inputMode="numeric"
          autoComplete="off"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. 1234567"
          className="w-36 rounded-pill border border-line bg-bg px-3 py-1.5 text-sm text-text placeholder:text-text-faint"
        />
        <button
          type="submit"
          className="rounded-pill bg-accent px-5 py-1.5 text-sm font-semibold text-on-accent transition-colors duration-hover hover:bg-accent-dim"
        >
          Analyse my team
        </button>
        <span className="text-xs text-text-faint">
          Find it in the FPL site URL: /entry/<span className="num">ID</span>/event/…
        </span>
      </form>

      {state === 'loading' && <EmptyState kind="loading" rows={6} title="Loading" />}
      {state === 'error' && (
        <EmptyState
          kind="error"
          title="Could not load the data."
          hint="Refresh in a minute. If it keeps failing, the FPL API is having a moment."
        />
      )}
      {state === 'notfound' && (
        <EmptyState
          kind="error"
          title="No team with that ID."
          hint="Check the number in your FPL URL: fantasy.premierleague.com/entry/ID/…"
        />
      )}

      {state === 'ready' && data && (
        <>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <span className="font-display text-lg font-bold">{data.entry.team_name}</span>
              <span className="ml-2 text-sm text-text-muted">{data.entry.manager}</span>
            </div>
            <span className="flex items-center gap-3">
              <span className="num text-xs text-text-faint">
                GW{data.gw}
                {data.entry.overall_rank !== null &&
                  ` · overall rank ${data.entry.overall_rank.toLocaleString('en-GB')}`}
              </span>
              <button
                onClick={share}
                disabled={sharing}
                className="rounded-pill border border-line bg-bg-raised px-3.5 py-1 text-xs font-semibold text-text transition-colors duration-hover hover:bg-bg-overlay disabled:opacity-50"
              >
                {sharing ? 'Rendering…' : 'Share as image'}
              </button>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section>
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="font-display text-base font-bold">Your XI</h2>
                <span className="num text-sm">
                  <span className="text-accent">
                    <CountUp value={myTotal} />
                  </span>
                  <span className="ml-1 text-xs text-text-muted">predicted pts</span>
                </span>
              </div>
              <PitchFrame>
                {rows.map(
                  (row, i) =>
                    row.length > 0 && (
                      <div key={i} className="flex items-start justify-center gap-2 sm:gap-4">
                        {row.map((p) => (
                          <PitchSpot
                            key={p.id}
                            name={p.name}
                            photo={playerPhotoUrl(p.code)}
                            xpts={byElementId.get(String(p.id))?.xpts_total ?? null}
                            isCaptain={p.is_captain}
                            flagged={p.status !== 'a'}
                          />
                        ))}
                      </div>
                    )
                )}
              </PitchFrame>
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-card border border-line bg-bg-raised px-3 py-2">
                <span className="text-xs uppercase tracking-wider text-text-faint">Bench</span>
                {bench.map((p) => (
                  <span key={p.id} className="flex items-center gap-1.5 text-xs text-text-muted">
                    <TeamBadge src={teamBadgeUrl(p.team_code)} alt={p.team} size={14} />
                    {p.name}
                    <span className="num text-text-faint">
                      {byElementId.get(String(p.id))?.xpts_total.toFixed(1) ?? '—'}
                    </span>
                  </span>
                ))}
              </div>
            </section>

            {defconTeam && (
              <section>
                <div className="mb-2 flex items-baseline justify-between">
                  <h2 className="font-display text-base font-bold">The predicted XI</h2>
                  <span className="num text-sm">
                    <span className="text-accent">
                      <CountUp value={defconTeam.total} />
                    </span>
                    <span className="ml-1 text-xs text-text-muted">
                      predicted pts · {defconTeam.formation}
                    </span>
                  </span>
                </div>
                <PitchFrame>
                  {[[defconTeam.gk], defconTeam.def, defconTeam.mid, defconTeam.fwd].map(
                    (row, i) => (
                      <div key={i} className="flex items-start justify-center gap-2 sm:gap-4">
                        {row.map((p) => (
                          <PitchSpot
                            key={p.player_id}
                            name={p.name}
                            photo={playerPhotoUrl(p.code)}
                            xpts={p.xpts_total}
                          />
                        ))}
                      </div>
                    )
                  )}
                </PitchFrame>
                <div className="mt-2 rounded-card border border-line bg-bg-raised px-3 py-2 text-xs text-text-muted">
                  Best available XI by predicted points, max three per club, likely starters only.
                </div>
              </section>
            )}
          </div>

          {upgrade && (
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-card border border-accent/25 bg-tint-accent px-4 py-3">
              <span className="rounded-pill bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
                BIGGEST UPGRADE
              </span>
              <span className="text-sm text-text">
                {upgrade.out.name} <span className="text-text-faint">→</span> {upgrade.in.name}
              </span>
              <span className="num text-sm text-accent">
                +{upgrade.gain.toFixed(1)} predicted pts per GW
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
