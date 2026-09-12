'use client';

// DESIGN.md §2: dense table row. Rank/name/team/price core plus screen-specific
// stat cells passed as children. Hover raises bg.overlay; click opens the drawer.

import RankBadge from './RankBadge';

export interface PlayerRowProps {
  rank: number;
  name: string;
  team: string;
  position: string;
  /** Price in £m, e.g. 4.5 */
  price: number;
  /** Optional element before the name, e.g. a PlayerAvatar */
  avatar?: React.ReactNode;
  /** Screen-specific stat cells (each a <td>) */
  children?: React.ReactNode;
  onClick?: () => void;
}

export default function PlayerRow({
  rank,
  name,
  team,
  position,
  price,
  avatar,
  children,
  onClick,
}: PlayerRowProps) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-line transition-colors duration-hover hover:bg-bg-overlay ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <td className="num px-3 py-2 text-text-muted">
        {rank <= 3 ? <RankBadge rank={rank} /> : rank}
      </td>
      <td className="px-3 py-2">
        <span className="flex items-center gap-2.5">
          {avatar}
          <span className="text-text">{name}</span>
          <span className="text-xs text-text-faint">{team}</span>
        </span>
      </td>
      <td className="px-3 py-2 text-text-muted">{position}</td>
      <td className="num px-3 py-2">{price.toFixed(1)}</td>
      {children}
    </tr>
  );
}
