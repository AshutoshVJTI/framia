import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Your Firebase configuration
// Replace these with your actual Firebase config values
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase - ensure we only initialize once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Subscription types
export interface UserSubscription {
  userId: string;
  isSubscribed: boolean;
  plan: 'free' | 'weekly' | 'monthly';
  subscriptionId?: string;
  customerId?: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  remainingGenerations: number;
  totalGenerations: number;
  createdAt: Date;
  updatedAt: Date;
}

// Database functions for subscription management
export const subscriptionDB = {
  // Get user subscription data
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const docRef = doc(db, 'subscriptions', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          currentPeriodStart: data.currentPeriodStart?.toDate(),
          currentPeriodEnd: data.currentPeriodEnd?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as UserSubscription;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      throw error;
    }
  },

  // Create initial user subscription (free tier)
  async createUserSubscription(userId: string): Promise<UserSubscription> {
    try {
      const subscription = {
        userId,
        isSubscribed: false,
        plan: 'free' as const,
        status: 'trial' as const,
        remainingGenerations: 3,
        totalGenerations: 0,
      };

      const docRef = doc(db, 'subscriptions', userId);
      await setDoc(docRef, {
        ...subscription,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return subscription as UserSubscription;
    } catch (error) {
      console.error('Error creating user subscription:', error);
      throw error;
    }
  },

  // Update subscription (for webhook handling)
  async updateSubscription(userId: string, updates: Partial<UserSubscription>): Promise<void> {
    try {
      const docRef = doc(db, 'subscriptions', userId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  },

  // Consume a generation (for free users)
  async consumeGeneration(userId: string): Promise<number> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (subscription.isSubscribed) {
        // Unlimited for subscribed users
        return 999;
      }

      const newRemainingGenerations = Math.max(0, subscription.remainingGenerations - 1);
      const newTotalGenerations = subscription.totalGenerations + 1;

      await this.updateSubscription(userId, {
        remainingGenerations: newRemainingGenerations,
        totalGenerations: newTotalGenerations,
      });

      return newRemainingGenerations;
    } catch (error) {
      console.error('Error consuming generation:', error);
      throw error;
    }
  },

  // Check if subscription is active and valid
  isSubscriptionActive(subscription: UserSubscription): boolean {
    if (!subscription.isSubscribed) return false;
    if (subscription.status !== 'active') return false;
    
    // Check if subscription hasn't expired
    if (subscription.currentPeriodEnd && new Date() > subscription.currentPeriodEnd) {
      return false;
    }
    
    return true;
  }
};

export { app, auth, db, googleProvider }; 