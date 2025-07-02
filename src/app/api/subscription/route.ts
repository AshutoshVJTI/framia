import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

interface UserSubscription {
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

// Server-side subscription functions
const adminSubscriptionDB = {
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const adminDb = getAdminDb();
      const docRef = adminDb.collection('subscriptions').doc(userId);
      const docSnap = await docRef.get();
      
      if (docSnap.exists) {
        const data = docSnap.data();
        return {
          ...data,
          currentPeriodStart: data?.currentPeriodStart?.toDate(),
          currentPeriodEnd: data?.currentPeriodEnd?.toDate(),
          createdAt: data?.createdAt?.toDate(),
          updatedAt: data?.updatedAt?.toDate(),
        } as UserSubscription;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      throw error;
    }
  },

  async createUserSubscription(userId: string): Promise<UserSubscription> {
    try {
      const adminDb = getAdminDb();
      const subscription = {
        userId,
        isSubscribed: false,
        plan: 'free' as const,
        status: 'trial' as const,
        remainingGenerations: 3,
        totalGenerations: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = adminDb.collection('subscriptions').doc(userId);
      await docRef.set(subscription);

      return subscription as UserSubscription;
    } catch (error) {
      console.error('Error creating user subscription:', error);
      throw error;
    }
  },

  async updateSubscription(userId: string, updates: Partial<UserSubscription>): Promise<void> {
    try {
      const adminDb = getAdminDb();
      const docRef = adminDb.collection('subscriptions').doc(userId);
      await docRef.update({
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  },

  async consumeGeneration(userId: string): Promise<number> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const newTotalGenerations = subscription.totalGenerations + 1;

      if (subscription.isSubscribed) {
        // For subscribed users, just increment total generations (unlimited)
        await this.updateSubscription(userId, {
          totalGenerations: newTotalGenerations,
        });
        return 999; // Unlimited
      }

      // For free users, decrement remaining generations
      const newRemainingGenerations = Math.max(0, subscription.remainingGenerations - 1);

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

  isSubscriptionActive(subscription: UserSubscription): boolean {
    if (!subscription.isSubscribed) return false;
    if (subscription.status !== 'active') return false;
    
    if (subscription.currentPeriodEnd && new Date() > subscription.currentPeriodEnd) {
      return false;
    }
    
    return true;
  }
};

// GET /api/subscription - Get user subscription status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    let subscription = await adminSubscriptionDB.getUserSubscription(userId);
    
    // Create subscription if it doesn't exist (new user)
    if (!subscription) {
      subscription = await adminSubscriptionDB.createUserSubscription(userId);
    }

    // Check if subscription is still active
    const isActive = adminSubscriptionDB.isSubscriptionActive(subscription);
    
    return NextResponse.json({
      subscription: {
        ...subscription,
        isActive,
      }
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

// POST /api/subscription/consume - Consume a generation
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const remainingGenerations = await adminSubscriptionDB.consumeGeneration(userId);
    
    return NextResponse.json({
      remainingGenerations,
      success: true
    });
  } catch (error) {
    console.error('Error consuming generation:', error);
    return NextResponse.json(
      { error: 'Failed to consume generation' },
      { status: 500 }
    );
  }
}

 