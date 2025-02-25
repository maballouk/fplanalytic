'use client';

import React, { useState } from 'react';

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
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header - Always visible */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-premier-league-purple to-blue-500 hover:from-premier-league-purple/90 hover:to-blue-500/90 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <img src="/premier-league-logo.svg" alt="Premier League" className="w-6 h-6" />
          <div>
            <h2 className="text-white font-semibold">Matchweek {matchweek}</h2>
            <p className="text-xs text-white/80">Latest Results & Fixtures</p>
          </div>
        </div>
        <svg 
          className={`w-5 h-5 text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="divide-y divide-gray-100">
          {fixtures.map((matchDay, index) => (
            <div key={index} className="p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">{matchDay.date}</h3>
              <div className="space-y-2">
                {matchDay.matches.map((match, matchIndex) => (
                  <div key={matchIndex} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-24 text-right font-medium text-gray-900">{match.homeTeam}</div>
                      <div className="flex items-center">
                        {match.isLive ? (
                          <div className="flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            <span className="font-medium text-red-600 min-w-[60px] text-center">
                              {match.homeScore} - {match.awayScore}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-600 min-w-[60px] text-center">{match.time}</span>
                        )}
                      </div>
                      <div className="w-24 text-left font-medium text-gray-900">{match.awayTeam}</div>
                    </div>
                    <img
                      src={`/channels/${match.channel}.svg`}
                      alt={match.channel}
                      className="w-12 h-3 object-contain opacity-60"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}