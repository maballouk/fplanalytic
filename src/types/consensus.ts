export interface BlogMention {
  source: string;
  reason: string;
  timestamp: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface ConsensusPlayer {
  id: number;
  name: string;
  club: string;
  position: string;
  imageUrl: string;
  mentions: BlogMention[];
  mentionPercentage: number;
  form: number;
  expectedPoints: number;
  fixturesDifficulty: number;
  priceChange: number;
  trend: 'rising' | 'falling' | 'stable' | 'differential';
  lastUpdated: string;
}

export interface ConsensusResponse {
  topPicks: ConsensusPlayer[];
  risingPicks: ConsensusPlayer[];
  fallingPicks: ConsensusPlayer[];
  differentialPicks: ConsensusPlayer[];
  lastUpdated: string;
  sources: string[];
}

export const BLOG_SOURCES = [
  'Fantasy Football Scout',
  'Fantasy Football Geek',
  'Fantasy Football Hub',
  'All About FPL',
  'FPL Hints'
];

export const TREND_LABELS = {
  rising: 'Rising Stars',
  falling: 'Falling Stars',
  differential: 'Differentials',
  stable: 'Consistent Performers'
};