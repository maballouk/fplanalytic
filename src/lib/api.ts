import axios from 'axios';
import { FplPlayer, Team, GameweekFixture, PlayerPrediction } from '../types/fpl';

const BUDGET_THRESHOLD = 7.0; // Players under £7.0m considered budget-friendly

interface ApiResponse<T> {
  data: T;
  season: string;
  lastUpdated: string;
}

async function fetchFromApi(endpoint: string) {
  try {
    const response = await axios.get(`/api/fpl?endpoint=${endpoint}`);
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (status === 404) {
        throw new Error('Resource not found');
      }
    }
    throw new Error(`Failed to fetch data from ${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function fetchBootstrapStatic() {
  const data = await fetchFromApi('bootstrap-static');
  return data;
}

export async function fetchFixtures() {
  const data = await fetchFromApi('fixtures');
  return Array.isArray(data) ? data : [];
}

function safeParseFloat(value: string | number | null | undefined): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

export function calculateForm(player: FplPlayer): number {
  const rawForm = safeParseFloat(player.form);
  const chanceOfPlaying = player.chance_of_playing_next_round ?? 100;
  
  return Math.min(10, rawForm * (chanceOfPlaying / 100));
}

export function calculateRotationRisk(player: FplPlayer): number {
  const minutes = player.minutes || 0;
  const gamesPlayed = minutes / 90;
  const chanceOfPlaying = player.chance_of_playing_next_round ?? 100;
  const averageMinutes = gamesPlayed > 0 ? minutes / gamesPlayed : 0;
  
  let risk = 0;
  
  if (chanceOfPlaying < 100) {
    risk += (100 - chanceOfPlaying);
  }
  
  if (averageMinutes < 45) {
    risk += 50;
  } else if (averageMinutes < 60) {
    risk += 30;
  } else if (averageMinutes < 80) {
    risk += 15;
  }
  
  const form = safeParseFloat(player.form);
  if (form < 2) {
    risk += 20;
  }
  
  return Math.min(100, Math.max(0, risk));
}

function getNextFixture(
  playerTeamId: number,
  fixtures: GameweekFixture[],
  teams: Team[]
): { opponent: Team; isHome: boolean; difficulty: number; gameweek: number } | null {
  const nextFixture = fixtures.find(f => 
    (f.team_h === playerTeamId || f.team_a === playerTeamId) && 
    !f.finished && 
    f.event !== null
  );

  if (!nextFixture) return null;

  const isHome = nextFixture.team_h === playerTeamId;
  const opponentId = isHome ? nextFixture.team_a : nextFixture.team_h;
  const opponent = teams.find(t => t.id === opponentId);

  if (!opponent || !nextFixture.event) return null;

  const difficulty = isHome ? nextFixture.team_h_difficulty : nextFixture.team_a_difficulty;

  return {
    opponent,
    isHome,
    difficulty: difficulty || 3,
    gameweek: nextFixture.event
  };
}

export function calculateBuyRecommendation(
  player: FplPlayer,
  fixtures: GameweekFixture[],
  teams: Team[]
): number {
  try {
    const form = calculateForm(player);
    const rotationRisk = calculateRotationRisk(player);
    const pointsPerGame = safeParseFloat(player.points_per_game);
    const totalPoints = player.total_points || 0;
    const chanceOfPlaying = player.chance_of_playing_next_round ?? 100;
    const influence = safeParseFloat(player.influence);
    const creativity = safeParseFloat(player.creativity);
    const threat = safeParseFloat(player.threat);
    
    const formScore = Math.min(100, (form / 10) * 100);
    
    const nextFixture = getNextFixture(player.team, fixtures, teams);
    const fixtureDifficulty = nextFixture ? nextFixture.difficulty : 3;
    const fixtureScore = Math.min(100, ((5 - fixtureDifficulty) / 4) * 100);
    
    const performanceScore = Math.min(100, 
      pointsPerGame * 8 +
      (influence / 100) * 4 +
      (creativity / 100) * 4 +
      (threat / 100) * 4
    );
    
    const availabilityScore = chanceOfPlaying;
    
    const weights = {
      form: 0.25,
      fixture: 0.15,
      rotation: 0.20,
      performance: 0.30,
      availability: 0.10
    };
    
    const rotationScore = 100 - rotationRisk;
    
    const weightedScore = Math.round(
      formScore * weights.form +
      fixtureScore * weights.fixture +
      rotationScore * weights.rotation +
      performanceScore * weights.performance +
      availabilityScore * weights.availability
    );
    
    return Math.min(100, Math.max(0, weightedScore));
  } catch (error) {
    console.error('Error calculating buy recommendation:', error);
    return 0;
  }
}

function calculatePredictedPoints(player: FplPlayer, form: number): number {
  const pointsPerGame = safeParseFloat(player.points_per_game);
  const chanceOfPlaying = player.chance_of_playing_next_round ?? 100;
  
  let prediction = pointsPerGame;
  
  if (form > 0) {
    prediction = prediction * (form / 5);
  }
  
  prediction = prediction * (chanceOfPlaying / 100);
  
  return Math.min(10, Math.max(0, prediction));
}

interface TopPlayersResult {
  allPlayers: PlayerPrediction[];
  budgetSuggestions: PlayerPrediction[];
  premiumSuggestions: PlayerPrediction[];
  lastUpdated: string;
}

export async function getTopPlayers(): Promise<TopPlayersResult> {
  try {
    const { data: bootstrapData, lastUpdated } = await fetchBootstrapStatic();
    
    if (!bootstrapData?.elements || !bootstrapData?.teams) {
      throw new Error('Invalid data structure received from API');
    }
    
    const fixtures = await fetchFixtures();
    const players: FplPlayer[] = bootstrapData.elements;
    const teams: Team[] = bootstrapData.teams;
    
    const allPredictions: PlayerPrediction[] = players
      .filter(player => {
        const minutes = player.minutes || 0;
        const chanceOfPlaying = player.chance_of_playing_next_round ?? 100;
        const form = safeParseFloat(player.form);
        const pointsPerGame = safeParseFloat(player.points_per_game);
        
        return (minutes > 0 || chanceOfPlaying > 0) && 
               form > 0 && 
               pointsPerGame > 0 &&
               minutes >= 270;
      })
      .map(player => {
        const form = calculateForm(player);
        const predictedPoints = calculatePredictedPoints(player, form);
        const buyRecommendation = calculateBuyRecommendation(player, fixtures, teams);
        const xG = safeParseFloat(player.threat) / 100;
        const xA = safeParseFloat(player.creativity) / 100;
        const rotationRisk = calculateRotationRisk(player);
        const team = teams.find(t => t.id === player.team)!;
        const nextFixture = getNextFixture(player.team, fixtures, teams);

        return {
          player,
          team,
          nextFixture,
          predictedPoints,
          buyRecommendation,
          form,
          xG,
          xA,
          rotationRisk,
          formHistory: [form * 0.8, form * 0.85, form * 0.9, form * 0.95, form]
        };
      })
      .filter(prediction => prediction.form > 0 && prediction.predictedPoints > 0);
    
    // Sort predictions by score
    const sortedPredictions = allPredictions.sort((a, b) => {
      const scoreA = (a.buyRecommendation * 0.4) + (a.form * 60);
      const scoreB = (b.buyRecommendation * 0.4) + (b.form * 60);
      return scoreB - scoreA;
    });
    
    // Get budget and premium suggestions
    const budgetPlayers = sortedPredictions
      .filter(p => (p.player.now_cost / 10) <= BUDGET_THRESHOLD)
      .slice(0, 3);
    
    const premiumPlayers = sortedPredictions
      .filter(p => (p.player.now_cost / 10) > BUDGET_THRESHOLD)
      .slice(0, 3);
    
    // Select top 25 players while ensuring diversity
    const selectedPredictions: PlayerPrediction[] = [];
    const selectedTeams = new Set<number>();
    let index = 0;
    
    // First, add the absolute top 5 regardless of team
    for (let i = 0; i < 5 && index < sortedPredictions.length; i++) {
      selectedPredictions.push(sortedPredictions[index]);
      selectedTeams.add(sortedPredictions[index].player.team);
      index++;
    }
    
    // Then fill remaining slots while ensuring team diversity
    while (selectedPredictions.length < 25 && index < sortedPredictions.length) {
      const prediction = sortedPredictions[index];
      if (!selectedTeams.has(prediction.player.team) || 
          selectedPredictions.filter(p => p.player.team === prediction.player.team).length < 3) {
        selectedPredictions.push(prediction);
        selectedTeams.add(prediction.player.team);
      }
      index++;
    }
    
    return {
      allPlayers: selectedPredictions,
      budgetSuggestions: budgetPlayers,
      premiumSuggestions: premiumPlayers,
      lastUpdated
    };
  } catch (error) {
    console.error('Error in getTopPlayers:', error);
    throw error;
  }
}