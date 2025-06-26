import { NextRequest, NextResponse } from 'next/server';
import { subscriptionDB } from '@/lib/firebase';

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

    let subscription = await subscriptionDB.getUserSubscription(userId);
    
    // Create subscription if it doesn't exist (new user)
    if (!subscription) {
      subscription = await subscriptionDB.createUserSubscription(userId);
    }

    // Check if subscription is still active
    const isActive = subscriptionDB.isSubscriptionActive(subscription);
    
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

    const remainingGenerations = await subscriptionDB.consumeGeneration(userId);
    
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