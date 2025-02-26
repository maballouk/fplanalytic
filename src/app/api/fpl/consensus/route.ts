import { NextResponse } from 'next/server';
import { ConsensusPlayer, BLOG_SOURCES } from '@/types/consensus';

// Mock data - to be replaced with actual web scraping
const MOCK_PLAYERS: ConsensusPlayer[] = [
  {
    id: 1,
    name: 'Mohamed Salah',
    club: 'Liverpool',
    position: 'MID',
    imageUrl: 'https://resources.premierleague.com/premierleague/photos/players/110x140/p118748.png',
    mentions: [
      {
        source: 'Fantasy Football Scout',
        reason: 'Excellent home record and on penalties',
        timestamp: new Date().toISOString(),
        sentiment: 'positive'
      },
      {
        source: 'Fantasy Football Hub',
        reason: 'High ownership and consistent returns',
        timestamp: new Date().toISOString(),
        sentiment: 'positive'
      }
    ],
    mentionPercentage: 100,
    form: 8.5,
    expectedPoints: 7.2,
    fixturesDifficulty: 2,
    priceChange: 0.2,
    trend: 'stable',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Erling Haaland',
    club: 'Manchester City',
    position: 'FWD',
    imageUrl: 'https://resources.premierleague.com/premierleague/photos/players/110x140/p223094.png',
    mentions: [
      {
        source: 'Fantasy Football Scout',
        reason: 'Premier League top scorer and fixture-proof',
        timestamp: new Date().toISOString(),
        sentiment: 'positive'
      }
    ],
    mentionPercentage: 90,
    form: 9.0,
    expectedPoints: 8.5,
    fixturesDifficulty: 3,
    priceChange: 0.1,
    trend: 'rising',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Ollie Watkins',
    club: 'Aston Villa',
    position: 'FWD',
    imageUrl: 'https://resources.premierleague.com/premierleague/photos/players/110x140/p178301.png',
    mentions: [
      {
        source: 'All About FPL',
        reason: 'Consistent returns and great underlying stats',
        timestamp: new Date().toISOString(),
        sentiment: 'positive'
      }
    ],
    mentionPercentage: 75,
    form: 7.8,
    expectedPoints: 6.5,
    fixturesDifficulty: 2,
    priceChange: 0.3,
    trend: 'differential',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 4,
    name: 'Son Heung-min',
    club: 'Tottenham',
    position: 'MID',
    imageUrl: 'https://resources.premierleague.com/premierleague/photos/players/110x140/p85971.png',
    mentions: [
      {
        source: 'FPL Hints',
        reason: 'Recent dip in form but good fixtures ahead',
        timestamp: new Date().toISOString(),
        sentiment: 'neutral'
      }
    ],
    mentionPercentage: 60,
    form: 6.2,
    expectedPoints: 5.8,
    fixturesDifficulty: 2,
    priceChange: -0.1,
    trend: 'falling',
    lastUpdated: new Date().toISOString()
  }
];

export async function GET() {
  try {
    // In a real implementation, this would:
    // 1. Fetch latest blog posts from each source
    // 2. Extract player mentions and reasons using NLP
    // 3. Calculate consensus percentages
    // 4. Determine trends based on historical data
    // 5. Categorize players into the four groups

    const topPicks = MOCK_PLAYERS.filter(p => p.trend === 'stable');
    const risingPicks = MOCK_PLAYERS.filter(p => p.trend === 'rising');
    const fallingPicks = MOCK_PLAYERS.filter(p => p.trend === 'falling');
    const differentialPicks = MOCK_PLAYERS.filter(p => p.trend === 'differential');

    return NextResponse.json({
      topPicks,
      risingPicks,
      fallingPicks,
      differentialPicks,
      lastUpdated: new Date().toISOString(),
      sources: BLOG_SOURCES
    });
  } catch (error) {
    console.error('Error fetching consensus picks:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch consensus picks',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}