'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface PaywallContextType {
  isSubscribed: boolean;
  isLoading: boolean;
  remainingGenerations: number;
  showPaywall: boolean;
  openCheckout: () => void;
  resetRemainingGenerations: () => void;
  consumeGeneration: () => void;
  closePaywall: () => void;
  // For demo/testing only
  simulateSuccessfulSubscription: () => void;
  // Force refresh subscription status
  refreshSubscriptionStatus: () => void;
}

const PaywallContext = createContext<PaywallContextType>({
  isSubscribed: false,
  isLoading: true,
  remainingGenerations: 0,
  showPaywall: false,
  openCheckout: () => {},
  resetRemainingGenerations: () => {},
  consumeGeneration: () => {},
  closePaywall: () => {},
  simulateSuccessfulSubscription: () => {},
  refreshSubscriptionStatus: () => {},
});

export const usePaywall = () => useContext(PaywallContext);

export const PaywallProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [remainingGenerations, setRemainingGenerations] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  
  // Free tier allows 3 generations
  const FREE_TIER_LIMIT = 3;

  // Initialize paywall based on user
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const checkSubscriptionStatus = async () => {
      setIsLoading(true);
      try {
        // Check URL parameters for successful checkout
        const urlParams = new URLSearchParams(window.location.search);
        const checkoutSuccess = urlParams.get('checkout_success');
        
        // In a real app, you would check with your backend to verify subscription
        // For demo, we'll use localStorage to simulate subscription state
        const storedSubscription = localStorage.getItem(`subscription_${user.uid}`);
        
        // If checkout was successful, mark as subscribed
        if (checkoutSuccess === 'true' || storedSubscription) {
          setIsSubscribed(true);
          // Store subscription status
          localStorage.setItem(`subscription_${user.uid}`, 'true');
          // Reset counter since user is subscribed
          setRemainingGenerations(999); // Unlimited for subscribers
          
          // Clean up URL parameters
          if (checkoutSuccess) {
            const url = new URL(window.location.href);
            url.searchParams.delete('checkout_success');
            window.history.replaceState({}, '', url.toString());
          }
        } else {
          // Check remaining generations for free tier
          const storedGenerations = localStorage.getItem(`generations_${user.uid}`);
          if (storedGenerations) {
            setRemainingGenerations(parseInt(storedGenerations));
          } else {
            // First time user
            setRemainingGenerations(FREE_TIER_LIMIT);
            localStorage.setItem(`generations_${user.uid}`, FREE_TIER_LIMIT.toString());
          }
          setIsSubscribed(false);
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscriptionStatus();
  }, [user]);

  // Opens the checkout page
  const openCheckout = () => {
    // Show the paywall modal if it's not already showing
    setShowPaywall(true);
    
    // In a production app, you would:
    // 1. Generate a custom checkout URL with user data
    // 2. Track the checkout attempt
    // 3. Set up webhook to handle successful payments
    
    // Note: The actual window.open call is in the PaywallModal component
    // to ensure users see the paywall info before proceeding to checkout
  };
  
  // Simulate a successful subscription (for demo/testing purposes only)
  const simulateSuccessfulSubscription = () => {
    if (user) {
      // Store subscription in localStorage
      localStorage.setItem(`subscription_${user.uid}`, 'true');
      // Update state
      setIsSubscribed(true);
      setShowPaywall(false);
      resetRemainingGenerations();
    }
  };

  // Reset the remaining generations (for subscribed users)
  const resetRemainingGenerations = () => {
    if (user) {
      if (isSubscribed) {
        // Unlimited for subscribers
        setRemainingGenerations(999);
        // Clear any stored generation count for free users
        localStorage.removeItem(`generations_${user.uid}`);
      } else {
        // Reset to free tier limit
        setRemainingGenerations(FREE_TIER_LIMIT);
        localStorage.setItem(`generations_${user.uid}`, FREE_TIER_LIMIT.toString());
      }
    }
  };

  // Use one generation
  const consumeGeneration = () => {
    if (user && !isSubscribed) {
      const newCount = Math.max(0, remainingGenerations - 1);
      setRemainingGenerations(newCount);
      localStorage.setItem(`generations_${user.uid}`, newCount.toString());
      
      // Show paywall when user runs out of generations
      if (newCount === 0) {
        setShowPaywall(true);
      }
    }
  };
  
  // Close the paywall modal
  const closePaywall = () => {
    setShowPaywall(false);
  };

  // Force refresh subscription status
  const refreshSubscriptionStatus = () => {
    if (user) {
      const storedSubscription = localStorage.getItem(`subscription_${user.uid}`);
      if (storedSubscription) {
        setIsSubscribed(true);
        setRemainingGenerations(999);
      }
    }
  };

  const value = {
    isSubscribed,
    isLoading,
    remainingGenerations,
    showPaywall,
    openCheckout,
    resetRemainingGenerations,
    consumeGeneration,
    closePaywall,
    simulateSuccessfulSubscription,
    refreshSubscriptionStatus
  };

  return (
    <PaywallContext.Provider value={value}>
      {children}
    </PaywallContext.Provider>
  );
}; 