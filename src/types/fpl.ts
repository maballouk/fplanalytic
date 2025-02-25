export interface FplPlayer {
  id: number;
  first_name: string;
  second_name: string;
  web_name: string;
  team: number;
  element_type: number;
  selected_by_percent: string;
  now_cost: number;
  points_per_game: string;
  total_points: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  form: string;
  chance_of_playing_next_round: number | null;
  chance_of_playing_this_round: number | null;
  code: number;
}

export interface Team {
  id: number;
  name: string;
  short_name: string;
  strength: number;
  strength_overall_home: number;
  strength_overall_away: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
}

export interface GameweekFixture {
  id: number;
  event: number;
  team_h: number;
  team_a: number;
  team_h_score: number | null;
  team_a_score: number | null;
  started: boolean;
  finished: boolean;
  kickoff_time: string;
  minutes: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
}

export interface PlayerPrediction {
  player: FplPlayer;
  team: Team;
  nextFixture: {
    opponent: Team;
    isHome: boolean;
    difficulty: number;
    gameweek: number;
  } | null;
  predictedPoints: number;
  buyRecommendation: number;
  form: number;
  xG: number;
  xA: number;
  rotationRisk: number;
  formHistory: number[];
}

// Helper function to get player photo URL
export function getPlayerPhotoUrl(code: number): string {
  return `https://resources.premierleague.com/premierleague/photos/players/110x140/p${code}.png`;
}