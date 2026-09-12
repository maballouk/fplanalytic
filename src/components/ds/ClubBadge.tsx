'use client';

// Club crest in a ring, falling back to the three-letter code when the logo
// 404s. Used on UCL fixture cards and anywhere a club needs visual identity.

import { useState } from 'react';

export interface ClubBadgeProps {
  /** Crest image URL; null renders the code immediately */
  src: string | null;
  code: string;
  ringColor: string;
  size?: number;
  title?: string;
}

export default function ClubBadge({ src, code, ringColor, size = 40, title }: ClubBadgeProps) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-pill bg-bg-overlay p-1.5 font-semibold text-text"
      style={{ width: size, height: size, border: `2px solid ${ringColor}`, fontSize: size * 0.28 }}
      title={title ?? code}
    >
      {src === null || failed ? (
        code
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- remote CDN, images unoptimized
        <img
          src={src}
          alt={title ?? code}
          loading="lazy"
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
