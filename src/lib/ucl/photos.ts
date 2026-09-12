// UEFA player headshots, self-hosted under public/img/ucl/players.
// img.uefa.com blocks hotlinking from other origins (verified 2026-09-13), so
// scripts/mirror_ucl_images.py downloads the shown players' photos on every
// prediction build; the UI falls back to initials for the handful without one.

export function uclPlayerPhotoUrl(playerId: string): string {
  return `/img/ucl/players/${playerId}.jpg`;
}
