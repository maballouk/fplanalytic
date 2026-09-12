// Club identity for the 36 league-phase teams (2026/27): short code + primary
// colour for badges, card strips and table dots. Keys are the engine's
// canonical names (adapters/teams.py). Unknown clubs fall back to grey.

export interface ClubIdentity {
  code: string;
  color: string;
  /** UEFA team id for img.uefa.com logos (from the fantasy feed's tId) */
  uefaId?: string;
}

const CLUBS: Record<string, ClubIdentity> = {
  'AEK Athens': { code: 'AEK', color: '#FFD200', uefaId: '50129' },
  Arsenal: { code: 'ARS', color: '#EF0107', uefaId: '52280' },
  'Aston Villa': { code: 'AVL', color: '#95BFE5', uefaId: '52683' },
  'Atlético Madrid': { code: 'ATM', color: '#CB3524', uefaId: '50124' },
  Barcelona: { code: 'BAR', color: '#A50044', uefaId: '50080' },
  'Bayern Munich': { code: 'BAY', color: '#DC052D', uefaId: '50037' },
  'Bodø/Glimt': { code: 'BOD', color: '#FFDD00', uefaId: '59333' },
  'Borussia Dortmund': { code: 'BVB', color: '#FDE100', uefaId: '52758' },
  'Club Brugge': { code: 'CLU', color: '#0070B3', uefaId: '50043' },
  Como: { code: 'COM', color: '#16466F', uefaId: '79946' },
  Fenerbahçe: { code: 'FEN', color: '#FFED00', uefaId: '52692' },
  Feyenoord: { code: 'FEY', color: '#E31B23', uefaId: '52749' },
  Galatasaray: { code: 'GAL', color: '#FDB912', uefaId: '50067' },
  'Inter Milan': { code: 'INT', color: '#0068A8', uefaId: '50138' },
  LASK: { code: 'LAS', color: '#D0111B', uefaId: '63405' },
  Lens: { code: 'RCL', color: '#FFCF00', uefaId: '52277' },
  Lille: { code: 'LIL', color: '#E01E13', uefaId: '75797' },
  Liverpool: { code: 'LIV', color: '#C8102E', uefaId: '7889' },
  'Manchester City': { code: 'MCI', color: '#6CABDD', uefaId: '52919' },
  'Manchester United': { code: 'MUN', color: '#DA291C', uefaId: '52682' },
  Napoli: { code: 'NAP', color: '#12A0D7', uefaId: '50136' },
  'PSV Eindhoven': { code: 'PSV', color: '#ED1C24', uefaId: '50062' },
  'Paris Saint-Germain': { code: 'PSG', color: '#2f6fb0', uefaId: '52747' },
  Porto: { code: 'POR', color: '#00428C', uefaId: '50064' },
  'RB Leipzig': { code: 'RBL', color: '#DD0741', uefaId: '2603790' },
  'Real Betis': { code: 'BET', color: '#00954C', uefaId: '52265' },
  'Real Madrid': { code: 'RMA', color: '#FEBE10', uefaId: '50051' },
  Roma: { code: 'ROM', color: '#8E1F2F', uefaId: '50137' },
  'Sabah FK': { code: 'SAB', color: '#9CA3AF', uefaId: '2609356' },
  'Shakhtar Donetsk': { code: 'SHK', color: '#F26522', uefaId: '52707' },
  'Slavia Prague': { code: 'SLP', color: '#CE1126', uefaId: '52498' },
  'Slovan Bratislava': { code: 'SVB', color: '#6AB2E2', uefaId: '52797' },
  'Sporting CP': { code: 'SCP', color: '#008057', uefaId: '50149' },
  'VfB Stuttgart': { code: 'VFB', color: '#E32219', uefaId: '50107' },
  Viking: { code: 'VIK', color: '#1B3B6F', uefaId: '52319' },
  Villarreal: { code: 'VIL', color: '#FFE667', uefaId: '70691' },
};

// Crests are self-hosted (img.uefa.com blocks hotlinking; see
// scripts/mirror_ucl_images.py, which keeps public/img/ucl/clubs in sync).
export function uclBadgeUrl(team: string): string | null {
  const id = CLUBS[team]?.uefaId;
  return id ? `/img/ucl/clubs/${id}.png` : null;
}

export function club(team: string): ClubIdentity {
  return CLUBS[team] ?? { code: team.slice(0, 3).toUpperCase(), color: '#374151' };
}
