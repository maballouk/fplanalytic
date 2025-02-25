import React from 'react';

export default function PlayerCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-start space-x-3 mb-4">
        <div className="w-12 h-12 rounded-lg bg-gray-200 animate-pulse flex-shrink-0" />
        <div className="flex-grow">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-7 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
              <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-5 bg-gray-200 rounded w-16 animate-pulse" />
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="h-4 bg-gray-200 rounded w-16 mb-2 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="flex items-center space-x-2">
            <div className="w-24 bg-gray-200 rounded-full h-3 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-8 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}