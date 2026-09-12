// Official Premier League media CDN (the legacy dashboard used the same URLs).
// `code` is the stable player/team media id from bootstrap, NOT the element id.

export function playerPhotoUrl(code: number): string {
  return `https://resources.premierleague.com/premierleague/photos/players/110x140/p${code}.png`;
}

export function teamBadgeUrl(code: number): string {
  return `https://resources.premierleague.com/premierleague/badges/70/t${code}.png`;
}
