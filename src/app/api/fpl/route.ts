import { NextResponse } from 'next/server';

const CURRENT_SEASON = '2024-25';
const BASE_URL = 'https://fantasy.premierleague.com/api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'bootstrap-static';

    // Construct the URL with the current season
    let url;
    if (endpoint === 'bootstrap-static') {
      url = `${BASE_URL}/bootstrap-static/`;
    } else if (endpoint === 'fixtures') {
      // Get only upcoming fixtures for the current season
      url = `${BASE_URL}/fixtures/?future=1`;
    } else {
      url = `${BASE_URL}/${endpoint}/`;
    }

    console.log('Fetching from URL:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      next: {
        revalidate: 43200 // Cache for 12 hours (twice daily)
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Season ${CURRENT_SEASON} data not found. The season might not have started yet.`);
      }
      throw new Error(`FPL API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // For fixtures, ensure difficulty is properly set
    if (endpoint === 'fixtures') {
      const fixtures = Array.isArray(data) ? data : [];
      const processedFixtures = fixtures.map(fixture => {
        // FPL API uses team strength to determine difficulty
        // Home team difficulty is based on away team's strength
        // Away team difficulty is based on home team's strength
        return {
          ...fixture,
          team_h_difficulty: fixture.team_h_difficulty || 3, // Default to normal if not set
          team_a_difficulty: fixture.team_a_difficulty || 3  // Default to normal if not set
        };
      });

      console.log('Processed fixtures sample:', processedFixtures.slice(0, 2));

      return NextResponse.json({
        data: processedFixtures,
        season: CURRENT_SEASON,
        lastUpdated: new Date().toISOString()
      });
    }

    // Add season information to the response
    const responseData = {
      data: data,
      season: CURRENT_SEASON,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(responseData);
  } catch (error) {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'bootstrap-static';
    
    console.error('Error fetching FPL data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch FPL data',
        details: error instanceof Error ? error.message : 'Unknown error',
        season: CURRENT_SEASON,
        data: endpoint === 'fixtures' ? [] : null
      },
      { status: 500 }
    );
  }
}