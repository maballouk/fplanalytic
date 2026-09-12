// Club identity for the 36 league-phase teams (2026/27): short code + primary
// colour for badges, card strips and table dots. Keys are the engine's
// canonical names (adapters/teams.py). Unknown clubs fall back to grey.

export interface ClubIdentity {
  code: string;
  color: string;
}

const CLUBS: Record<string, ClubIdentity> = {
  'AEK Athens': { code: 'AEK', color: '#FFD200' },
  Arsenal: { code: 'ARS', color: '#EF0107' },
  'Aston Villa': { code: 'AVL', color: '#95BFE5' },
  'Atlético Madrid': { code: 'ATM', color: '#CB3524' },
  Barcelona: { code: 'BAR', color: '#A50044' },
  'Bayern Munich': { code: 'BAY', color: '#DC052D' },
  'Bodø/Glimt': { code: 'BOD', color: '#FFDD00' },
  'Borussia Dortmund': { code: 'BVB', color: '#FDE100' },
  'Club Brugge': { code: 'CLU', color: '#0070B3' },
  Como: { code: 'COM', color: '#16466F' },
  Fenerbahçe: { code: 'FEN', color: '#FFED00' },
  Feyenoord: { code: 'FEY', color: '#E31B23' },
  Galatasaray: { code: 'GAL', color: '#FDB912' },
  'Inter Milan': { code: 'INT', color: '#0068A8' },
  LASK: { code: 'LAS', color: '#D0111B' },
  Lens: { code: 'RCL', color: '#FFCF00' },
  Lille: { code: 'LIL', color: '#E01E13' },
  Liverpool: { code: 'LIV', color: '#C8102E' },
  'Manchester City': { code: 'MCI', color: '#6CABDD' },
  'Manchester United': { code: 'MUN', color: '#DA291C' },
  Napoli: { code: 'NAP', color: '#12A0D7' },
  'PSV Eindhoven': { code: 'PSV', color: '#ED1C24' },
  'Paris Saint-Germain': { code: 'PSG', color: '#2f6fb0' },
  Porto: { code: 'POR', color: '#00428C' },
  'RB Leipzig': { code: 'RBL', color: '#DD0741' },
  'Real Betis': { code: 'BET', color: '#00954C' },
  'Real Madrid': { code: 'RMA', color: '#FEBE10' },
  Roma: { code: 'ROM', color: '#8E1F2F' },
  'Sabah FK': { code: 'SAB', color: '#9CA3AF' },
  'Shakhtar Donetsk': { code: 'SHK', color: '#F26522' },
  'Slavia Prague': { code: 'SLP', color: '#CE1126' },
  'Slovan Bratislava': { code: 'SVB', color: '#6AB2E2' },
  'Sporting CP': { code: 'SCP', color: '#008057' },
  'VfB Stuttgart': { code: 'VFB', color: '#E32219' },
  Viking: { code: 'VIK', color: '#1B3B6F' },
  Villarreal: { code: 'VIL', color: '#FFE667' },
};

export function club(team: string): ClubIdentity {
  return CLUBS[team] ?? { code: team.slice(0, 3).toUpperCase(), color: '#374151' };
}
