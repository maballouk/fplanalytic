'use client';

// Small inline club crest that removes itself if the image fails, leaving the
// text label beside it to carry the meaning. For table rows and stat lines.

import { useState } from 'react';

export default function TeamBadge({
  src,
  alt,
  size = 18,
}: {
  src: string;
  alt: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote CDN, images unoptimized
    <img
      src={src}
      alt={alt}
      loading="lazy"
      width={size}
      height={size}
      className="inline-block shrink-0 object-contain"
      onError={() => setFailed(true)}
    />
  );
}
