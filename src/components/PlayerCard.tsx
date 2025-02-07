import React from 'react';
import { PlayerPrediction } from '../types/fpl';

interface PlayerCardProps {
  prediction: PlayerPrediction;
}

export default function PlayerCard({ prediction }: PlayerCardProps) {
  const { player, team, nextFixture, predictedPoints, buyRecommendation, form } = prediction;

  // Format numbers to handle undefined/null values
  const formatNumber = (value: number | null | undefined, decimals = 1): string => {
    if (value === null || value === undefined || isNaN(value)) return '0.0';
    return value.toFixed(decimals);
  };

  const getDifficultyColor = (difficulty: number): string => {
    // FPL API difficulty ratings:
    // 1-2: Easy (green)
    // 3: Normal (gray)
    // 4-5: Hard (red)
    if (difficulty <= 2) {
      return 'bg-green-500 hover:bg-green-600';
    } else if (difficulty >= 4) {
      return 'bg-red-500 hover:bg-red-600';
    }
    return 'bg-gray-500 hover:bg-gray-600';
  };

  const getDifficultyLabel = (difficulty: number): string => {
    if (difficulty <= 2) return 'Easy';
    if (difficulty >= 4) return 'Hard';
    return 'Normal';
  };

  const getBuyRecommendationColor = (value: number): string => {
    if (isNaN(value) || value === null || value === undefined) return 'bg-gray-400';
    if (value > 75) return 'bg-green-500';
    if (value > 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatColor = (value: number, max: number): string => {
    if (isNaN(value) || value === null || value === undefined) return 'text-gray-600';
    const percentage = (value / max) * 100;
    if (percentage > 66) return 'text-green-600';
    if (percentage > 33) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Ensure buyRecommendation is a valid number between 0 and 100
  const validBuyRecommendation = isNaN(buyRecommendation) || buyRecommendation === null ? 0 : Math.min(100, Math.max(0, buyRecommendation));

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-grow">
          <h3 className="text-xl font-bold text-gray-900">
            {`${player.first_name} ${player.second_name}`}
          </h3>
          <p className="text-gray-600 font-medium">{team.name}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-600">£{(player.now_cost / 10).toFixed(1)}m</span>
        </div>
      </div>

      {/* Next Fixture */}
      {nextFixture && (
        <div className="mb-4 bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Next Match (GW{nextFixture.gameweek})</p>
              <p className="font-medium">
                {nextFixture.isHome ? 'vs' : '@'} {nextFixture.opponent.name}
              </p>
            </div>
            <div 
              className={`w-4 h-4 rounded cursor-help transition-colors duration-200 ${getDifficultyColor(nextFixture.difficulty)}`}
              title={`Difficulty: ${getDifficultyLabel(nextFixture.difficulty)} (${nextFixture.difficulty})`}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600 mb-1">Predicted Points</p>
          <p className={`text-2xl font-bold ${getStatColor(predictedPoints, 10)}`}>
            {formatNumber(predictedPoints)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600 mb-1">Form</p>
          <p className={`text-2xl font-bold ${getStatColor(form, 10)}`}>
            {formatNumber(form)}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-900">Buy Recommendation</span>
          <div className="flex items-center space-x-2">
            <div className="w-24 bg-gray-200 rounded-full h-3">
              <div
                className={`rounded-full h-3 transition-all duration-300 ${getBuyRecommendationColor(validBuyRecommendation)}`}
                style={{ width: `${validBuyRecommendation}%` }}
              />
            </div>
            <span className="text-sm font-bold text-gray-900">{Math.round(validBuyRecommendation)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}