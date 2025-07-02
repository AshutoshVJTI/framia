'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { UserSubscription } from '@/lib/firebase';

interface PaywallContextType {
  isSubscribed: boolean;
  isLoading: boolean;
  remainingGenerations: number;
  showPaywall: boolean;
  subscription: UserSubscription | null;
  openCheckout: () => void;
  resetRemainingGenerations: () => void;
  consumeGeneration: () => void;
  closePaywall: () => void;
  refreshSubscriptionStatus: () => void;
}

const PaywallContext = createContext<PaywallContextType | undefined>(undefined);

export const usePaywall = (): PaywallContextType => {
  const context = useContext(PaywallContext);
  if (!context) {
    throw new Error('usePaywall must be used within a PaywallProvider');
  }
  return context;
};

export const PaywallProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  
  // Fetch subscription data from API
  const fetchSubscription = useCallback(async () => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/subscription?userId=${user.uid}`);
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }
      
      const data = await response.json();
      setSubscription(data.subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      // Fallback to default state for new users
      setSubscription({
        userId: user.uid,
        isSubscribed: false,
        plan: 'free',
        status: 'trial',
        remainingGenerations: 3,
        totalGenerations: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Initialize subscription data when user changes
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Check for successful checkout from URL parameters
  useEffect(() => {
    const checkCheckoutSuccess = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const checkoutSuccess = urlParams.get('checkout_success');
      
      if (checkoutSuccess === 'true' && user?.uid) {
        // Wait a moment for webhook to process, then refresh
        setTimeout(() => {
          fetchSubscription();
        }, 2000);
        
        // Clean up URL parameters
        const url = new URL(window.location.href);
        url.searchParams.delete('checkout_success');
        window.history.replaceState({}, '', url.toString());
      }
    };

    if (user?.uid) {
      checkCheckoutSuccess();
    }
  }, [user?.uid, fetchSubscription]);

  // Opens the checkout page
  const openCheckout = () => {
    setShowPaywall(true);
  };
  
  // Reset the remaining generations (for subscribed users)
  const resetRemainingGenerations = () => {
    if (subscription) {
      const updated = {
        ...subscription,
        remainingGenerations: subscription.isSubscribed ? 999 : 3,
      };
      setSubscription(updated);
    }
  };

  // Consume one generation
  const consumeGeneration = async () => {
    if (!user?.uid || !subscription) return;

    // Optimistic update for better UX
    if (!subscription.isSubscribed) {
      const newRemainingGenerations = Math.max(0, subscription.remainingGenerations - 1);
      setSubscription({
        ...subscription,
        remainingGenerations: newRemainingGenerations,
        totalGenerations: subscription.totalGenerations + 1,
      });

      // Show paywall when user runs out of generations
      if (newRemainingGenerations === 0) {
        setShowPaywall(true);
      }
    } else {
      // For subscribed users, just increment total generations (unlimited)
      setSubscription({
        ...subscription,
        totalGenerations: subscription.totalGenerations + 1,
      });
    }

    // Make API call to update database
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid }),
      });

      if (!response.ok) {
        throw new Error('Failed to consume generation');
      }

      const data = await response.json();
      
      // Update with server response (but keep unlimited for subscribed users)
      setSubscription(prev => prev ? {
        ...prev,
        remainingGenerations: prev.isSubscribed ? 999 : data.remainingGenerations,
        totalGenerations: prev.totalGenerations + 1,
      } : null);
      
    } catch (error) {
      console.error('Error consuming generation:', error);
      // Revert optimistic update on error
      fetchSubscription();
    }
  };
  
  // Close the paywall modal
  const closePaywall = () => {
    setShowPaywall(false);
  };

  // Force refresh subscription status
  const refreshSubscriptionStatus = () => {
    fetchSubscription();
  };

  // Derived values
  const isSubscribed = subscription?.isSubscribed && subscription?.status === 'active' || false;
  const remainingGenerations = subscription?.remainingGenerations || 0;

  const value = {
    isSubscribed,
    isLoading,
    remainingGenerations,
    showPaywall,
    subscription,
    openCheckout,
    resetRemainingGenerations,
    consumeGeneration,
    closePaywall,
    refreshSubscriptionStatus,
  };

  return (
    <PaywallContext.Provider value={value}>
      {children}
    </PaywallContext.Provider>
  );
}; 