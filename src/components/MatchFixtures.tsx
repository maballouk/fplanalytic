'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Match {
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  time: string;
  status: 'upcoming' | 'live' | 'finished';
  isLive: boolean;
  channel: string;
}

interface MatchDay {
  date: string;
  matches: Match[];
}

interface LiveFixturesResponse {
  matchweek: number;
  fixtures: MatchDay[];
  lastUpdated: string;
}

export default function MatchFixtures() {
  const [matchweek, setMatchweek] = useState(0);
  const [fixtures, setFixtures] = useState<MatchDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLiveMatches, setHasLiveMatches] = useState(false);

  const fetchFixtures = async () => {
    try {
      const response = await axios.get<LiveFixturesResponse>('/api/fpl/live-fixtures');
      setMatchweek(response.data.matchweek);
      setFixtures(response.data.fixtures);
      
      // Check if there are any live matches
      const liveMatches = response.data.fixtures.some(day => 
        day.matches.some(match => match.status === 'live')
      );
      setHasLiveMatches(liveMatches);
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch fixtures');
      console.error('Error fetching fixtures:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFixtures();
    
    // Set refresh interval based on whether there are live matches
    const interval = setInterval(fetchFixtures, hasLiveMatches ? 30000 : 60000);
    return () => clearInterval(interval);
  }, [hasLiveMatches]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 w-full lg:w-80 animate-pulse">
        <div className="bg-gradient-to-r from-premier-league-purple to-blue-500 rounded-lg p-4 mb-4 opacity-75">
          <div className="h-8 w-32 bg-white/20 rounded" />
          <div className="h-4 w-48 bg-white/20 rounded mt-1" />
        </div>
        <div className="space-y-4">
          {[1, 2].map((day) => (
            <div key={day} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
              <div className="h-6 w-40 bg-gray-200 rounded mb-3" />
              <div className="space-y-3">
                {[1, 2, 3].map((match) => (
                  <div key={match} className="flex items-center justify-between">
                    <div className="h-6 w-48 bg-gray-200 rounded" />
                    <div className="h-4 w-16 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 w-full lg:w-80">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button 
                onClick={fetchFixtures} 
                className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 w-full lg:w-80">
      {/* Header */}
      <div className="bg-gradient-to-r from-premier-league-purple to-blue-500 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2">
          <img src="/premier-league-logo.svg" alt="Premier League" className="w-8 h-8" />
          <h2 className="text-xl font-bold text-white">Matchweek {matchweek}</h2>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-white/80">All times shown are your local time</p>
          {hasLiveMatches && (
            <span className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">Live</span>
            </span>
          )}
        </div>
      </div>

      {/* Fixtures */}
      <div className="space-y-4">
        {fixtures.map((matchDay, index) => (
          <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{matchDay.date}</h3>
            <div className="space-y-3">
              {matchDay.matches.map((match, matchIndex) => (
                <div key={matchIndex} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex items-center justify-between flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium w-12 ${
                          match.status === 'live' ? 'text-green-700' :
                          match.status === 'finished' ? 'text-gray-700' :
                          'text-blue-700'
                        }`}>{match.homeTeam}</span>
                        {match.status === 'live' && (
                          <div className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-medium">
                              {match.homeScore} - {match.awayScore} ({match.time})
                            </span>
                          </div>
                        )}
                        {match.status === 'finished' && (
                          <span className="text-sm bg-gray-100 text-gray-700 font-medium px-2 py-0.5 rounded-md">
                            {match.homeScore} - {match.awayScore}
                          </span>
                        )}
                        {match.status === 'upcoming' && (
                          <span className="text-sm bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">
                            {match.time}
                          </span>
                        )}
                        <span className={`font-medium w-12 text-right ${
                          match.status === 'live' ? 'text-green-700' :
                          match.status === 'finished' ? 'text-gray-700' :
                          'text-blue-700'
                        }`}>{match.awayTeam}</span>
                      </div>
                    </div>
                  </div>
                  <img
                    src={`/channels/${match.channel}.svg`}
                    alt={match.channel}
                    className="w-16 h-4 object-contain ml-2"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}