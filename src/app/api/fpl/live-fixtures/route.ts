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
  stats: Array<{
    identifier: string;
    a: Array<{ element: number; value: number }>;
    h: Array<{ element: number; value: number }>;
  }>;
}

interface MatchEvent {
  player: string;
  type: 'goal' | 'assist' | 'yellow' | 'red';
  minute: number;
}

interface Team {
  id: number;
  name: string;
  short_name: string;
}

export async function GET() {
  try {
    // Fetch teams data
    const teamsResponse = await fetch(`${BASE_URL}/bootstrap-static/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      next: { revalidate: 30 } // Revalidate every 30 seconds for live data
    });

    if (!teamsResponse.ok) {
      throw new Error(`Failed to fetch teams: ${teamsResponse.status}`);
    }

    const teamsData = await teamsResponse.json();
    const teams: Team[] = teamsData.teams;
    const currentEvent = teamsData.events.find((e: any) => e.is_current);

    if (!currentEvent) {
      throw new Error('No current gameweek found');
    }

    // Fetch all fixtures for current gameweek
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

      const homeTeam = teams.find(t => t.id === fixture.team_h);
      const awayTeam = teams.find(t => t.id === fixture.team_a);

      if (!homeTeam || !awayTeam) return acc;

      // Format match time
      let displayTime;
      if (fixture.started && !fixture.finished) {
        displayTime = `${fixture.minutes}'`;
      } else if (fixture.finished) {
        displayTime = 'FT';
      } else {
        displayTime = date.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }

      // Process match events
      const events: MatchEvent[] = [];
      
      if (fixture.stats) {
        // Process goals
        const goals = fixture.stats.find(s => s.identifier === 'goals');
        if (goals) {
          goals.h.forEach(g => {
            const player = teamsData.elements.find((p: any) => p.id === g.element);
            if (player) {
              events.push({
                player: `${player.first_name} ${player.second_name}`,
                type: 'goal',
                minute: g.value
              });
            }
          });
          goals.a.forEach(g => {
            const player = teamsData.elements.find((p: any) => p.id === g.element);
            if (player) {
              events.push({
                player: `${player.first_name} ${player.second_name}`,
                type: 'goal',
                minute: g.value
              });
            }
          });
        }

        // Process assists
        const assists = fixture.stats.find(s => s.identifier === 'assists');
        if (assists) {
          assists.h.forEach(a => {
            const player = teamsData.elements.find((p: any) => p.id === a.element);
            if (player) {
              events.push({
                player: `${player.first_name} ${player.second_name}`,
                type: 'assist',
                minute: a.value
              });
            }
          });
          assists.a.forEach(a => {
            const player = teamsData.elements.find((p: any) => p.id === a.element);
            if (player) {
              events.push({
                player: `${player.first_name} ${player.second_name}`,
                type: 'assist',
                minute: a.value
              });
            }
          });
        }

        // Process yellow cards
        const yellows = fixture.stats.find(s => s.identifier === 'yellow_cards');
        if (yellows) {
          yellows.h.forEach(y => {
            const player = teamsData.elements.find((p: any) => p.id === y.element);
            if (player) {
              events.push({
                player: `${player.first_name} ${player.second_name}`,
                type: 'yellow',
                minute: y.value
              });
            }
          });
          yellows.a.forEach(y => {
            const player = teamsData.elements.find((p: any) => p.id === y.element);
            if (player) {
              events.push({
                player: `${player.first_name} ${player.second_name}`,
                type: 'yellow',
                minute: y.value
              });
            }
          });
        }

        // Process red cards
        const reds = fixture.stats.find(s => s.identifier === 'red_cards');
        if (reds) {
          reds.h.forEach(r => {
            const player = teamsData.elements.find((p: any) => p.id === r.element);
            if (player) {
              events.push({
                player: `${player.first_name} ${player.second_name}`,
                type: 'red',
                minute: r.value
              });
            }
          });
          reds.a.forEach(r => {
            const player = teamsData.elements.find((p: any) => p.id === r.element);
            if (player) {
              events.push({
                player: `${player.first_name} ${player.second_name}`,
                type: 'red',
                minute: r.value
              });
            }
          });
        }
      }

      // Sort events by minute
      events.sort((a, b) => a.minute - b.minute);

      const match = {
        homeTeam: homeTeam.short_name,
        awayTeam: awayTeam.short_name,
        homeScore: fixture.team_h_score,
        awayScore: fixture.team_a_score,
        time: displayTime,
        isLive: fixture.started && !fixture.finished,
        channel: 'bein-sports',
        events: events.length > 0 ? events : undefined
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

    // Sort matches by kickoff time within each day
    Object.values(groupedFixtures).forEach((day: any) => {
      day.matches.sort((a: any, b: any) => {
        // Put live matches first
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;
        // Then finished matches
        if (a.time === 'FT' && b.time !== 'FT') return -1;
        if (a.time !== 'FT' && b.time === 'FT') return 1;
        // Then by time
        return a.time.localeCompare(b.time);
      });
    });

    const matchDays = Object.values(groupedFixtures);

    return NextResponse.json({
      matchweek: currentEvent.id,
      data: matchDays,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching live fixtures:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch live fixtures',
        details: error instanceof Error ? error.message : 'Unknown error',
        data: []
      },
      { status: 500 }
    );
  }
}