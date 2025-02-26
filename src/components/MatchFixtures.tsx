'use client';

import React, { useState } from 'react';

interface MatchEvent {
  player: string;
  type: 'goal' | 'assist' | 'yellow' | 'red';
  minute: number;
}

interface Match {
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  time: string;
  isLive?: boolean;
  channel: string;
  events?: MatchEvent[];
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
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const renderMatchEvents = (events: MatchEvent[] = []) => {
    const groupedEvents = events.reduce((acc: Record<string, MatchEvent[]>, event) => {
      if (!acc[event.type]) acc[event.type] = [];
      acc[event.type].push(event);
      return acc;
    }, {});

    return (
      <div className="space-y-3">
        {/* Goals */}
        {groupedEvents.goal && groupedEvents.goal.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Goals</h4>
            <div className="space-y-1">
              {groupedEvents.goal.map((event, i) => (
                <div key={i} className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                  <span>{event.player} ({event.minute}')</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assists */}
        {groupedEvents.assist && groupedEvents.assist.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Assists</h4>
            <div className="space-y-1">
              {groupedEvents.assist.map((event, i) => (
                <div key={i} className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                  <span>{event.player} ({event.minute}')</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cards */}
        {(groupedEvents.yellow || groupedEvents.red) && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Cards</h4>
            <div className="space-y-1">
              {groupedEvents.yellow?.map((event, i) => (
                <div key={`yellow-${i}`} className="flex items-center text-sm">
                  <div className="w-3 h-4 bg-yellow-400 mr-2 rounded-sm" />
                  <span>{event.player} ({event.minute}')</span>
                </div>
              ))}
              {groupedEvents.red?.map((event, i) => (
                <div key={`red-${i}`} className="flex items-center text-sm">
                  <div className="w-3 h-4 bg-red-600 mr-2 rounded-sm" />
                  <span>{event.player} ({event.minute}')</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

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
                <div key={matchIndex}>
                  <button 
                    onClick={() => setSelectedMatch(selectedMatch === match ? null : match)}
                    className={`w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                      selectedMatch === match ? 'bg-gray-50' : ''
                    }`}
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
                  </button>
                  {selectedMatch === match && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                      {match.events && match.events.length > 0 ? (
                        renderMatchEvents(match.events)
                      ) : (
                        <div className="text-sm text-gray-500 text-center py-2">
                          {match.homeScore !== undefined ? 
                            'No major events recorded for this match' :
                            'Match events will appear here when the game starts'
                          }
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}