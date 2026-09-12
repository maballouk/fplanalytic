'use client';

// First-visit comprehension strip (canvas-approved flow): three beats, shown
// until dismissed. localStorage is a per-viewer convenience and can be
// unavailable; every access is guarded.

import { useEffect, useState } from 'react';

const KEY = 'fpla_intro_dismissed';

export default function FirstVisit() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      // storage blocked: keep the strip hidden rather than nag on every load
    }
  }, []);

  if (!show) return null;

  return (
    <div className="flex items-center justify-between gap-6 border-b border-accent/15 bg-[#0e1a15] px-5 py-3">
      <div className="mx-auto flex w-full max-w-content flex-wrap items-center gap-x-7 gap-y-1 text-sm text-text-muted">
        <span>
          <span className="num text-accent">1</span>&nbsp; DEFCON is the new +2 for defensive work
        </span>
        <span>
          <span className="num text-accent">2</span>&nbsp; We track who hits it, twice a day and
          live on matchdays
        </span>
        <span>
          <span className="num text-accent">3</span>&nbsp; Every number links to how it is computed
        </span>
        <button
          aria-label="Dismiss"
          onClick={() => {
            setShow(false);
            try {
              localStorage.setItem(KEY, '1');
            } catch {
              // fine: it will show again next visit
            }
          }}
          className="ml-auto rounded-pill px-2 text-text-faint transition-colors duration-hover hover:bg-bg-overlay hover:text-text"
        >
          ×
        </button>
      </div>
    </div>
  );
}
