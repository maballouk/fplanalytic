import React from 'react';

interface Match {
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  time: string;
  isLive?: boolean;
  channel: string;
  difficulty?: number;
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
  const getDifficultyColor = (difficulty: number = 3): string => {
    if (difficulty <= 2) return 'bg-green-500';
    if (difficulty >= 4) return 'bg-red-500';
    return 'bg-gray-500';
  };

  const getDifficultyLabel = (difficulty: number = 3): string => {
    if (difficulty <= 2) return 'Easy';
    if (difficulty >= 4) return 'Hard';
    return 'Normal';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 w-full lg:w-80">
      {/* Header */}
      <div className="bg-gradient-to-r from-premier-league-purple to-blue-500 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2">
          <img src="/premier-league-logo.svg" alt="Premier League" className="w-8 h-8" />
          <h2 className="text-xl font-bold text-white">Matchweek {matchweek}</h2>
        </div>
        <p className="text-xs text-white/80 mt-1">All times shown are your local time</p>
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
                        <span className="font-medium text-gray-900 w-12">{match.homeTeam}</span>
                        {match.isLive ? (
                          <span className="text-sm bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                            {match.homeScore} - {match.awayScore}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-600">{match.time}</span>
                        )}
                        <span className="font-medium text-gray-900 w-12 text-right">{match.awayTeam}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${getDifficultyColor(match.difficulty)}`}
                      title={`Difficulty: ${getDifficultyLabel(match.difficulty)}`}
                    />
                    <img
                      src={`/channels/${match.channel}.svg`}
                      alt={match.channel}
                      className="w-16 h-4 object-contain"
                    />
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