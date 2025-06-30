'use client';

import React, { useState } from 'react';
import { usePaywall } from '@/context/PaywallContext';
import { useAuth } from '@/context/AuthContext';

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
  const { user } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Lemon Squeezy checkout URLs
  const WEEKLY_CHECKOUT_URL = "https://luneth.lemonsqueezy.com/buy/5fc864f2-03c2-43de-86b0-8dde4b387e13";
  const MONTHLY_CHECKOUT_URL = "https://luneth.lemonsqueezy.com/buy/15341766-3040-432f-81d8-c5bf73949f58";
  
  // Get current origin for success redirect
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const successUrl = `${origin}?checkout_success=true`;
  
  // Create checkout URL with user data
  const createCheckoutUrl = (baseUrl: string) => {
    const url = new URL(baseUrl);
    url.searchParams.set('embed', '1');
    url.searchParams.set('logo', '0');
    url.searchParams.set('success_url', successUrl);
    
    if (user?.uid) {
      url.searchParams.set('checkout[custom][user_id]', user.uid);
      url.searchParams.set('checkout[email]', user.email || '');
    }
    
    return url.toString();
  };

  const handleUpgradeClick = () => {
    setShowUpgradeModal(true);
  };

  const handlePlanSelect = (plan: 'weekly' | 'monthly') => {
    const url = plan === 'weekly' ? WEEKLY_CHECKOUT_URL : MONTHLY_CHECKOUT_URL;
    
    // Close our upgrade modal first
    setShowUpgradeModal(false);
    
    // Open Lemon Squeezy checkout in modal
    if (window.LemonSqueezy?.Url?.Open) {
      window.LemonSqueezy.Url.Open(createCheckoutUrl(url));
    } else {
      // Fallback if Lemon Squeezy script isn't loaded
      console.error('Lemon Squeezy script not loaded');
      alert('Checkout is loading... Please wait.');
    }
  };

  return (
    <>
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
            <button 
              onClick={handleUpgradeClick}
              className="lemonsqueezy-button ml-2 text-xs py-1 px-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer text-center"
            >
              Upgrade
            </button>
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

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Your Plan</h3>
              <p className="text-sm text-gray-600">Select the plan that works best for you</p>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handlePlanSelect('weekly')}
                className="w-full p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-900">Weekly Plan</h4>
                    <p className="text-sm text-gray-600">7-day access</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">$7</div>
                    <div className="text-xs text-gray-500">per week</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handlePlanSelect('monthly')}
                className="w-full p-4 border-2 border-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all duration-200 text-left"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-900">Monthly Plan</h4>
                    <p className="text-sm text-gray-600">30-day access</p>
                    <span className="text-xs text-blue-600 font-medium">Most Popular</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">$20</div>
                    <div className="text-xs text-gray-500">per month</div>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SubscriptionBadge; 