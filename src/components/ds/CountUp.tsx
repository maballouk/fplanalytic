'use client';

// Number that counts up on mount (ease-out cubic). Server-renders the final
// value so static HTML and no-JS readers see the real number; the animation
// only plays after hydration. Respects prefers-reduced-motion.

import { useEffect, useState } from 'react';

export default function CountUp({
  value,
  decimals = 1,
  duration = 650,
}: {
  value: number;
  decimals?: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    // matchMedia is absent in jsdom; treat that as reduced motion
    if (
      typeof window.matchMedia !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const k = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplay(value * eased);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{display.toFixed(decimals)}</>;
}
