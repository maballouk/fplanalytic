'use client';

// Red beacon on the Live nav item while Premier League matches are in play.
// One fetch per page load (the endpoint is server-cached 60s) — no polling.

import { useEffect, useState } from 'react';

export default function LiveDot() {
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/defcon/live')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { fixtures?: { started: boolean; finished: boolean }[] } | null) => {
        if (cancelled || !data?.fixtures) return;
        setLive(data.fixtures.some((f) => f.started && !f.finished));
      })
      .catch(() => {
        // no beacon on failure; the nav item still works
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!live) return null;
  return (
    <span
      className="absolute -right-1.5 -top-0.5 h-1.5 w-1.5 animate-pulse rounded-pill bg-danger"
      aria-label="Matches in play"
    />
  );
}
