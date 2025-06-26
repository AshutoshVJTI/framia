'use client';

import React from 'react';
import { usePaywall } from '@/context/PaywallContext';

// Use the same interface as in PaywallModal.tsx
declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Url: {
        Open: (url: string) => void;
      };
      Setup?: (options: { eventHandler: (event: { event: string; [key: string]: unknown }) => void }) => void;
    };
  }
}

const SubscriptionBadge = () => {
  const { isSubscribed, remainingGenerations, refreshSubscriptionStatus } = usePaywall();

  // Direct Lemon Squeezy checkout URLs
  const MONTHLY_CHECKOUT_URL = "https://luneth.lemonsqueezy.com/buy/984911a0-577e-4a97-b8cc-3b76fe2b9665";
  
  // Get current origin for success redirect
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const successUrl = `${origin}?checkout_success=true`;
  
  // Add parameters for overlay mode and success redirect
  const monthlyOverlayUrl = `${MONTHLY_CHECKOUT_URL}?embed=1&logo=0&success_url=${encodeURIComponent(successUrl)}`;

  return (
    <div className="bg-white shadow-sm rounded-full py-1.5 px-3 text-sm flex items-center space-x-1.5">
      {isSubscribed ? (
        <>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="font-medium text-gray-800">Pro Account</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-500">Unlimited</span>
        </>
      ) : (
        <>
          <div className={`w-2 h-2 rounded-full ${remainingGenerations > 0 ? 'bg-blue-500' : 'bg-red-500'}`}></div>
          <span className="font-medium text-gray-800">Free Plan</span>
          <span className="text-gray-500">•</span>
          <span className={`${remainingGenerations > 0 ? 'text-gray-500' : 'text-red-500 font-medium'}`}>
            {remainingGenerations} {remainingGenerations === 1 ? 'image' : 'images'} left
          </span>
          <a 
            href={monthlyOverlayUrl}
            className="lemonsqueezy-button ml-2 text-xs py-1 px-3 bg-gradient-primary text-white rounded-full font-medium hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer text-center"
          >
            Upgrade
          </a>
          {/* Temporary refresh button for testing */}
          <button
            onClick={refreshSubscriptionStatus}
            className="ml-1 text-xs py-1 px-2 bg-gray-200 text-gray-600 rounded-full font-medium hover:bg-gray-300 transition-all duration-200"
            title="Refresh subscription status"
          >
            ↻
          </button>
        </>
      )}
    </div>
  );
};

export default SubscriptionBadge; 