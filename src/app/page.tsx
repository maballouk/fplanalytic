'use client';

import { useEffect, useState } from 'react';
import PlayerCard from '../components/PlayerCard';
import PlayerCardSkeleton from '../components/PlayerCardSkeleton';
import { PlayerPrediction } from '../types/fpl';
import { getTopPlayers } from '../lib/api';
import MatchFixtures from '../components/MatchFixtures';

interface TopPlayersResult {
  allPlayers: PlayerPrediction[];
  budgetSuggestions: PlayerPrediction[];
  premiumSuggestions: PlayerPrediction[];
}

export default function Home() {
  const [players, setPlayers] = useState<TopPlayersResult>({
    allPlayers: [],
    budgetSuggestions: [],
    premiumSuggestions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getTopPlayers();
        setPlayers(response);
        if (response.lastUpdated) {
          setLastUpdate(new Date(response.lastUpdated).toLocaleString());
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch player data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Update twice daily (every 12 hours)
    const interval = setInterval(fetchData, 12 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Fixtures Section */}
      <div className="p-4 lg:p-8 mx-auto lg:mx-0">
        <MatchFixtures
          matchweek={25}
          fixtures={[
            {
              date: "Friday 14 February",
              matches: [
                {
                  homeTeam: "BHA",
                  awayTeam: "CHE",
                  homeScore: 3,
                  awayScore: 0,
                  time: "90+5'",
                  isLive: true,
                  channel: "bein-sports",
                  difficulty: 2
                }
              ]
            },
            {
              date: "Saturday 15 February",
              matches: [
                {
                  homeTeam: "LEI",
                  awayTeam: "ARS",
                  time: "15:30",
                  channel: "bein-sports",
                  difficulty: 4
                },
                {
                  homeTeam: "AVL",
                  awayTeam: "IPS",
                  time: "18:00",
                  channel: "bein-sports",
                  difficulty: 3
                },
                {
                  homeTeam: "FUL",
                  awayTeam: "NFO",
                  time: "18:00",
                  channel: "bein-sports",
                  difficulty: 2
                },
                {
                  homeTeam: "MCI",
                  awayTeam: "NEW",
                  time: "18:00",
                  channel: "bein-sports",
                  difficulty: 3
                },
                {
                  homeTeam: "SOU",
                  awayTeam: "BOU",
                  time: "18:00",
                  channel: "bein-sports"
                }
              ]
            }
          ]}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
      <div className="bg-premier-league-purple">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                FPL Analytics Dashboard
              </h1>
              <p className="mt-2 text-premier-league-green font-medium">
                Top 25 Premier League players based on form and next gameweek potential
              </p>
              <p className="mt-1 text-white/80 text-sm">
                Season 2024-25
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 rounded-lg px-4 py-2">
                <p className="text-sm text-white/80">Updates</p>
                <p className="text-xl font-bold text-white">Twice Daily</p>
                {lastUpdate && (
                  <p className="text-xs text-white/60 mt-1">
                    Last update: {lastUpdate}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Budget Picks */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Top Budget-Friendly Picks (Under £7.0m)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <PlayerCardSkeleton key={`budget-${index}`} />
                ))
              : players.budgetSuggestions.map((prediction) => (
                  <PlayerCard key={`budget-${prediction.player.id}`} prediction={prediction} />
                ))}
          </div>
        </div>

        {/* Premium Picks */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Top Premium Picks (£7.0m+)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <PlayerCardSkeleton key={`premium-${index}`} />
                ))
              : players.premiumSuggestions.map((prediction) => (
                  <PlayerCard key={`premium-${prediction.player.id}`} prediction={prediction} />
                ))}
          </div>
        </div>

        {/* All Players */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">All Top Performers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading
              ? Array.from({ length: 25 }).map((_, index) => (
                  <PlayerCardSkeleton key={`all-${index}`} />
                ))
              : players.allPlayers.map((prediction) => (
                  <PlayerCard key={`all-${prediction.player.id}`} prediction={prediction} />
                ))}
          </div>
        </div>

        {!loading && players.allPlayers.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-500 text-lg">
                No player data available at the moment
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Data is automatically refreshed twice daily to ensure you have the latest insights
          </p>
        </div>
      </div>
      </div>
    </main>
  );
}