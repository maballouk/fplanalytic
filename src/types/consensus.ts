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
  mentions: BlogMention[];
  mentionPercentage: number;
  form: number;
  expectedPoints: number;
  fixturesDifficulty: number;
  priceChange: number;
  trend: 'rising' | 'falling' | 'stable';
  lastUpdated: string;
}

export interface ConsensusResponse {
  topPicks: ConsensusPlayer[];
  risingPicks: ConsensusPlayer[];
  fallingPicks: ConsensusPlayer[];
  lastUpdated: string;
  sources: string[];
}

export interface BlogSource {
  name: string;
  url: string;
  selector: {
    container: string;
    playerName: string;
    reason: string;
  };
}