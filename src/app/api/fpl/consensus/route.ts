import { NextResponse } from 'next/server';
import { ConsensusPlayer, BlogMention } from '@/types/consensus';

// Mock data - to be replaced with actual web scraping
const MOCK_BLOG_SOURCES = [
  'Fantasy Football Scout',
  'Fantasy Football Geek',
  'Fantasy Football Hub',
  'All About FPL',
  'FPL Hints'
];

const MOCK_PLAYERS: ConsensusPlayer[] = [
  {
    id: 1,
    name: 'Mohamed Salah',
    club: 'Liverpool',
    position: 'MID',
    imageUrl: 'https://resources.premierleague.com/premierleague/photos/players/250x250/p118748.png',
    mentions: [
      {
        source: 'Expert Analysis',
        reason: 'Excellent home record and on penalties',
        timestamp: new Date().toISOString(),
        sentiment: 'positive'
      },
      {
        source: 'Performance Data',
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
    trend: 'rising',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Erling Haaland',
    club: 'Manchester City',
    position: 'FWD',
    imageUrl: 'https://resources.premierleague.com/premierleague/photos/players/250x250/p223094.png',
    mentions: [
      {
        source: 'Performance Data',
        reason: 'Premier League top scorer and fixture-proof',
        timestamp: new Date().toISOString(),
        sentiment: 'positive'
      }
    ],
    mentionPercentage: 80,
    form: 9.0,
    expectedPoints: 8.5,
    fixturesDifficulty: 3,
    priceChange: 0.1,
    trend: 'stable',
    lastUpdated: new Date().toISOString()
  }
];

export async function GET() {
  try {
    // In a real implementation, this would:
    // 1. Fetch latest blog posts from each source
    // 2. Extract player mentions and reasons
    // 3. Aggregate data and calculate consensus
    // 4. Update trends based on historical data

    // Sort players by mention percentage
    const sortedPlayers = [...MOCK_PLAYERS].sort((a, b) => b.mentionPercentage - a.mentionPercentage);

    // Separate rising and falling picks
    const risingPicks = sortedPlayers.filter(p => p.trend === 'rising');
    const fallingPicks = sortedPlayers.filter(p => p.trend === 'falling');

    return NextResponse.json({
      topPicks: sortedPlayers,
      risingPicks,
      fallingPicks,
      lastUpdated: new Date().toISOString(),
      sources: MOCK_BLOG_SOURCES
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