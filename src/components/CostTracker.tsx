'use client';

import { useState, useEffect } from 'react';

interface CostTrackerProps {
  onLimitReached?: () => void;
}

export default function CostTracker({ onLimitReached }: CostTrackerProps) {
  const [apiUsage, setApiUsage] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [dailyLimit] = useState(30);

  const COST_PER_IMAGE = 0.02; // $0.02 per image edit

  useEffect(() => {
    // Get usage from localStorage
    const today = new Date().toDateString();
    const storedUsage = localStorage.getItem(`api_usage_${today}`);
    if (storedUsage) {
      const usage = parseInt(storedUsage);
      setApiUsage(usage);
      setEstimatedCost(usage * COST_PER_IMAGE);
    }
  }, []);

  const usagePercentage = (apiUsage / dailyLimit) * 100;
  const isNearLimit = usagePercentage > 80;
  const isAtLimit = usagePercentage >= 100;

  if (isAtLimit && onLimitReached) {
    onLimitReached();
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-white">Daily Usage</h3>
        <span className={`text-sm ${isNearLimit ? 'text-red-400' : 'text-zinc-400'}`}>
          {apiUsage}/{dailyLimit} images
        </span>
      </div>
      
      <div className="w-full bg-zinc-800 rounded-full h-2 mb-3">
        <div 
          className={`h-2 rounded-full transition-all ${
            isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-zinc-400">
        <span>Estimated cost: ${estimatedCost.toFixed(2)}</span>
        <span>Resets at midnight</span>
      </div>
      
      {isNearLimit && (
        <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
          ⚠️ Approaching daily limit. Consider upgrading for more generations.
        </div>
      )}
    </div>
  );
} 