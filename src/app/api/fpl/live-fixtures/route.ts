import { NextResponse } from 'next/server';

const BASE_URL = 'https://fantasy.premierleague.com/api';

interface LiveFixture {
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
  provisional_start_time: boolean;
  finished_provisional: boolean;
  stats: any[];
}

interface Team {
  id: number;
  name: string;
  short_name: string;
}

interface Event {
  id: number;
  name: string;
  deadline_time: string;
  average_entry_score: number;
  finished: boolean;
  data_checked: boolean;
  highest_scoring_entry: number;
  deadline_time_epoch: number;
  deadline_time_game_offset: number;
  highest_score: number;
  is_previous: boolean;
  is_current: boolean;
  is_next: boolean;
}

export async function GET() {
  try {
    // Fetch bootstrap data for teams and current gameweek
    const bootstrapResponse = await fetch(`${BASE_URL}/bootstrap-static/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      next: { revalidate: 30 } // Revalidate every 30 seconds for live data
    });

    if (!bootstrapResponse.ok) {
      throw new Error(`Failed to fetch bootstrap data: ${bootstrapResponse.status}`);
    }

    const bootstrapData = await bootstrapResponse.json();
    const teams: Team[] = bootstrapData.teams;
    const events: Event[] = bootstrapData.events;

    // Find current gameweek
    const currentEvent = events.find(e => e.is_current);
    if (!currentEvent) {
      throw new Error('No current gameweek found');
    }

    // Fetch live fixtures for current gameweek
    const fixturesResponse = await fetch(`${BASE_URL}/fixtures/?event=${currentEvent.id}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      next: { revalidate: 30 } // Revalidate every 30 seconds for live data
    });

    if (!fixturesResponse.ok) {
      throw new Error(`Failed to fetch fixtures: ${fixturesResponse.status}`);
    }

    const fixtures: LiveFixture[] = await fixturesResponse.json();

    // Group fixtures by date
    const groupedFixtures = fixtures.reduce((acc: any, fixture) => {
      const date = new Date(fixture.kickoff_time);
      const dateStr = date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      const timeStr = date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const homeTeam = teams.find(t => t.id === fixture.team_h);
      const awayTeam = teams.find(t => t.id === fixture.team_a);

      if (!homeTeam || !awayTeam) return acc;

      // Determine match status
      let status = 'upcoming';
      let displayTime = timeStr;

      if (fixture.started && !fixture.finished) {
        status = 'live';
        displayTime = `${fixture.minutes}'`;
      } else if (fixture.finished) {
        status = 'finished';
        displayTime = 'FT';
      }

      const match = {
        homeTeam: homeTeam.short_name,
        awayTeam: awayTeam.short_name,
        homeScore: fixture.team_h_score,
        awayScore: fixture.team_a_score,
        time: displayTime,
        status,
        isLive: status === 'live',
        channel: 'bein-sports'
      };

      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: dateStr,
          matches: []
        };
      }

      acc[dateStr].matches.push(match);
      return acc;
    }, {});

    const matchDays = Object.values(groupedFixtures);

    return NextResponse.json({
      matchweek: currentEvent.id,
      fixtures: matchDays,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching live fixtures:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch live fixtures',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}