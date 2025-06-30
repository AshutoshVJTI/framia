'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { usePaywall } from '@/context/PaywallContext';
import { useAuth } from '@/context/AuthContext';

// Extend window to include LemonSqueezy functions from lemon.js
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

const PaywallModal = () => {
  const { showPaywall, closePaywall } = usePaywall();
  const { user } = useAuth();
  const scriptLoaded = useRef(false);
  
  // Lemon Squeezy checkout URLs - Replace with your actual product URLs
  const WEEKLY_CHECKOUT_URL = "https://luneth.lemonsqueezy.com/buy/5fc864f2-03c2-43de-86b0-8dde4b387e13"; // Replace with actual weekly product ID
  const MONTHLY_CHECKOUT_URL = "https://luneth.lemonsqueezy.com/buy/15341766-3040-432f-81d8-c5bf73949f58"; // Replace with actual monthly product ID
  
  // Get current origin for success redirect
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  
  // Add parameters for overlay mode and success redirect with checkout_success parameter
  const successUrl = `${origin}?checkout_success=true`;
  
  // Create checkout URLs with user data for webhook processing
  const createCheckoutUrl = (baseUrl: string) => {
    const url = new URL(baseUrl);
    url.searchParams.set('embed', '1');
    url.searchParams.set('logo', '0');
    url.searchParams.set('success_url', successUrl);
    
    // Add user data for webhook processing
    if (user?.uid) {
      url.searchParams.set('checkout[custom][user_id]', user.uid);
      url.searchParams.set('checkout[email]', user.email || '');
    }
    
    return url.toString();
  };

  // Handle successful checkout
  const handleCheckoutSuccess = useCallback(() => {
    // Close the paywall
    closePaywall();
    
    // Mark as subscribed and redirect with success parameter
    if (user) {
      localStorage.setItem(`subscription_${user.uid}`, 'true');
      
      // Redirect with success parameter to trigger subscription update
      const url = new URL(window.location.href);
      url.searchParams.set('checkout_success', 'true');
      window.location.href = url.toString();
    }
  }, [closePaywall, user]);

  // Initialize Lemon Squeezy JS
  useEffect(() => {
    // Only load the script once
    if (!scriptLoaded.current) {
      const script = document.createElement('script');
      script.src = 'https://assets.lemonsqueezy.com/lemon.js';
      script.defer = true;
      script.onload = () => {
        if (window.createLemonSqueezy) {
          window.createLemonSqueezy();
          
          // Set up event listener for checkout success
          if (window.LemonSqueezy?.Setup) {
            window.LemonSqueezy.Setup({
              eventHandler: (event) => {
                if (event.event === 'Checkout.Success') {
                  // Handle successful checkout
                  handleCheckoutSuccess();
                } else if (event.event === 'Checkout.Error') {
                  // Handle checkout errors
                  console.error('Checkout error:', event);
                }
              }
            });
          }
        }
      };
      document.body.appendChild(script);
      scriptLoaded.current = true;
    }
  }, [handleCheckoutSuccess]);
  
  if (!showPaywall) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 transition-opacity">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden slide-up">
        <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-6 text-white text-center">
          <div className="relative w-16 h-16 mx-auto mb-3">
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping"></div>
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-white/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            Upgrade to Pro
          </h2>
          <p className="text-white/90 text-sm">
            You&apos;ve reached the limit of the free plan
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-medium text-gray-800">Unlimited Images</h3>
                <p className="text-sm text-gray-600">Generate as many product images as you need</p>
              </div>
            </div>

            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-medium text-gray-800">Higher Resolution</h3>
                <p className="text-sm text-gray-600">Generate images up to 1024x1024 resolution</p>
              </div>
            </div>

            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-medium text-gray-800">Priority Processing</h3>
                <p className="text-sm text-gray-600">Your images are generated with higher priority</p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            
            {/* Pricing Options */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="border border-gray-300 rounded-lg p-4 text-center">
                <h4 className="font-medium text-gray-800 mb-1">Weekly</h4>
                <p className="text-2xl font-bold text-gray-900">$7</p>
                <p className="text-xs text-gray-600">7 days access</p>
              </div>
              <div className="border border-blue-500 bg-blue-50 rounded-lg p-4 text-center">
                <h4 className="font-medium text-gray-800 mb-1">Monthly</h4>
                <p className="text-2xl font-bold text-gray-900">$20</p>
                <p className="text-xs text-blue-600">Best value</p>
              </div>
            </div>

            <a 
              href={createCheckoutUrl(MONTHLY_CHECKOUT_URL)}
              className="lemonsqueezy-button w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold transition duration-200 hover:shadow-lg transform hover:-translate-y-1 text-center block"
              onClick={() => closePaywall()}
            >
              Upgrade to Pro - $20/month
            </a>

            <a 
              href={createCheckoutUrl(WEEKLY_CHECKOUT_URL)}
              className="lemonsqueezy-button w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-full font-medium transition duration-200 hover:bg-gray-50 text-center block"
              onClick={() => closePaywall()}
            >
              Try Weekly - $7/week
            </a>
            
            <button
              onClick={closePaywall} 
              className="w-full py-2 px-4 bg-transparent text-gray-500 hover:text-gray-700 text-sm transition duration-200"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaywallModal; 