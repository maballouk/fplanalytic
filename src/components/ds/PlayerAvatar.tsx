'use client';

// Player headshot with a club-colour ring and an initials fallback when the
// photo 404s (new signings, media-id gaps). Used across the asset finder,
// drawer, home stat strip and the UCL hub.

import { useState } from 'react';

export interface PlayerAvatarProps {
  src: string;
  name: string;
  /** Ring colour, e.g. the club's primary colour */
  ringColor?: string;
  size?: number;
}

export default function PlayerAvatar({
  src,
  name,
  ringColor = '#374151',
  size = 40,
}: PlayerAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill bg-bg-overlay font-semibold text-text"
      style={{ width: size, height: size, border: `2px solid ${ringColor}`, fontSize: size * 0.32 }}
    >
      {failed ? (
        initials
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- remote CDN, images unoptimized
        <img
          src={src}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover object-top"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
