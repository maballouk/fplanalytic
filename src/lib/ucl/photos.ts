// UEFA player headshots, keyed by the fantasy feed's player id.
// Pattern verified 2026-09-12 (200 image/jpeg); the season segment moves each
// year: 2027 = the 2026/27 season.

const SEASON_SEGMENT = 2027;

export function uclPlayerPhotoUrl(playerId: string): string {
  return `https://img.uefa.com/imgml/TP/players/1/${SEASON_SEGMENT}/324x324/${playerId}.jpg`;
}
