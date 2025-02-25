'use client';

import React from 'react';

interface Match {
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  time: string;
  isLive?: boolean;
  channel: string;
}

interface MatchDay {
  date: string;
  matches: Match[];
}

interface MatchFixturesProps {
  matchweek: number;
  fixtures: MatchDay[];
}

export default function MatchFixtures({ matchweek, fixtures }: MatchFixturesProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-premier-league-purple to-blue-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/premier-league-logo.svg" alt="Premier League" className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold text-white">Matchweek {matchweek}</h2>
              <p className="text-sm text-white/80">Latest Results & Fixtures</p>
            </div>
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
        {fixtures.map((matchDay, dayIndex) => (
          <div 
            key={dayIndex} 
            className="bg-gray-50 rounded-lg overflow-hidden"
          >
            <div className="bg-gray-100/80 px-4 py-2">
              <h3 className="text-sm font-semibold text-gray-600">{matchDay.date}</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {matchDay.matches.map((match, matchIndex) => (
                <div 
                  key={matchIndex} 
                  className="px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      {match.isLive && (
                        <span className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse mr-1.5" />
                          <span className="text-xs font-medium text-red-600 uppercase">Live</span>
                        </span>
                      )}
                      {!match.isLive && match.homeScore !== undefined && (
                        <span className="text-xs font-medium text-gray-500 uppercase">FT</span>
                      )}
                      {!match.isLive && match.homeScore === undefined && (
                        <span className="text-xs font-medium text-blue-600">{match.time}</span>
                      )}
                    </div>
                    <img
                      src={`/channels/${match.channel}.svg`}
                      alt={match.channel}
                      className="h-3 w-12 object-contain opacity-60"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {match.homeTeam}
                        </p>
                      </div>
                      <div className="mx-4 text-sm font-bold">
                        {match.homeScore !== undefined ? (
                          <span className={`${match.isLive ? 'text-red-600' : 'text-gray-900'}`}>
                            {match.homeScore} - {match.awayScore}
                          </span>
                        ) : (
                          <span className="text-gray-300">vs</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {match.awayTeam}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}