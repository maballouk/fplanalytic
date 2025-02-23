'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ConsensusPlayer, ConsensusResponse } from '@/types/consensus';

export default function ConsensusPanel() {
  const [data, setData] = useState<ConsensusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'top' | 'rising' | 'falling'>('top');

  const fetchConsensus = async () => {
    try {
      const response = await axios.get<ConsensusResponse>('/api/fpl/consensus');
      setData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch consensus picks');
      console.error('Error fetching consensus:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsensus();
    // Refresh every hour
    const interval = setInterval(fetchConsensus, 3600000);
    return () => clearInterval(interval);
  }, []);

  const renderPlayer = (player: ConsensusPlayer) => (
    <div key={player.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <img 
            src={player.imageUrl} 
            alt={player.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-grow">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {player.name}
                <span className="ml-2 text-sm font-medium text-gray-500">
                  {player.position} | {player.club}
                </span>
              </h3>
              <div className="mt-1 space-y-1">
                {player.mentions.map((mention, index) => (
                  <p key={index} className="text-sm text-gray-600">
                    {mention.reason}
                  </p>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-lg font-bold text-green-600">{player.mentionPercentage}%</div>
              <div className="text-sm text-gray-500">consensus</div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
        <div>
          <div className="text-sm font-medium text-gray-500">Form</div>
          <div className={`text-lg font-semibold ${
            player.form >= 7 ? 'text-green-600' :
            player.form >= 5 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {player.form.toFixed(1)}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">xPts</div>
          <div className="text-lg font-semibold text-blue-600">
            {player.expectedPoints.toFixed(1)}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">Difficulty</div>
          <div className={`text-lg font-semibold ${
            player.fixturesDifficulty <= 2 ? 'text-green-600' :
            player.fixturesDifficulty >= 4 ? 'text-red-600' :
            'text-gray-600'
          }`}>
            {player.fixturesDifficulty}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0" />
              <div className="flex-grow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="h-6 w-48 bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-64 bg-gray-200 rounded mb-4" />
                    <div className="space-y-2">
                      <div className="h-4 w-56 bg-gray-200 rounded" />
                      <div className="h-4 w-48 bg-gray-200 rounded" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="h-6 w-12 bg-gray-200 rounded mb-1" />
                    <div className="h-4 w-16 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div className="h-12 bg-gray-200 rounded" />
              <div className="h-12 bg-gray-200 rounded" />
              <div className="h-12 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
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
              onClick={fetchConsensus}
              className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">FPL Expert Consensus</h2>
        <div className="text-sm text-gray-500">
          Updated {new Date(data.lastUpdated).toLocaleDateString()}
        </div>
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('top')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'top'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Top Picks
        </button>
        <button
          onClick={() => setActiveTab('rising')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'rising'
              ? 'bg-green-100 text-green-700'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Rising
        </button>
        <button
          onClick={() => setActiveTab('falling')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'falling'
              ? 'bg-red-100 text-red-700'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Falling
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === 'top' && data.topPicks.map(renderPlayer)}
        {activeTab === 'rising' && data.risingPicks.map(renderPlayer)}
        {activeTab === 'falling' && data.fallingPicks.map(renderPlayer)}
      </div>
    </div>
  );
}