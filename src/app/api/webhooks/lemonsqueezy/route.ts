import { NextRequest, NextResponse } from 'next/server';
import { subscriptionDB } from '@/lib/firebase';
import crypto from 'crypto';

// Webhook secret from Lemon Squeezy dashboard
const WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

// Verify webhook signature
function verifySignature(body: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.error('LEMONSQUEEZY_WEBHOOK_SECRET not configured');
    return false;
  }

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(body);
  const computedSignature = hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(computedSignature, 'hex')
  );
}

// Handle Lemon Squeezy webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    if (!verifySignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    const { meta, data } = event;

    console.log('Received webhook event:', meta.event_name);

    // Extract user ID from custom data or customer email
    const userId = data.attributes?.custom_data?.user_id || 
                   data.attributes?.user_email;

    if (!userId) {
      console.error('No user ID found in webhook data');
      return NextResponse.json(
        { error: 'No user ID found' },
        { status: 400 }
      );
    }

    // Handle different webhook events
    switch (meta.event_name) {
      case 'subscription_created':
      case 'subscription_updated':
        await handleSubscriptionEvent(userId, data, 'active');
        break;

      case 'subscription_cancelled':
        await handleSubscriptionEvent(userId, data, 'cancelled');
        break;

      case 'subscription_expired':
        await handleSubscriptionEvent(userId, data, 'expired');
        break;

      case 'order_created':
        // Handle one-time purchases
        await handleOrderEvent(userId, data);
        break;

      default:
        console.log('Unhandled event:', meta.event_name);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle subscription events
async function handleSubscriptionEvent(
  userId: string, 
  data: { id: string; attributes: Record<string, unknown> }, 
  status: 'active' | 'cancelled' | 'expired'
) {
  try {
    const attributes = data.attributes;
    const productName = (attributes.product_name as string)?.toLowerCase() || '';
    
    // Determine plan type from product name
    let plan: 'weekly' | 'monthly' = 'monthly';
    if (productName.includes('weekly')) {
      plan = 'weekly';
    }

    // Calculate period dates with proper type checking
    const createdAt = attributes.created_at as string;
    const renewsAt = attributes.renews_at as string || attributes.ends_at as string;
    
    const currentPeriodStart = new Date(createdAt);
    const currentPeriodEnd = new Date(renewsAt);

    const updates = {
      isSubscribed: status === 'active',
      plan,
      subscriptionId: data.id,
      customerId: attributes.customer_id as string,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      remainingGenerations: status === 'active' ? 999 : 3, // Unlimited or reset to free
    };

    await subscriptionDB.updateSubscription(userId, updates);
    
    console.log('Updated subscription for user:', userId, updates);
  } catch (error) {
    console.error('Error handling subscription event:', error);
    throw error;
  }
}

// Handle one-time order events
async function handleOrderEvent(userId: string, data: { id: string; attributes: Record<string, unknown> }) {
  try {
    const attributes = data.attributes;
    const productName = (attributes.product_name as string)?.toLowerCase() || '';
    
    // Determine if this is a subscription or one-time purchase
    if (productName.includes('subscription') || productName.includes('monthly') || productName.includes('weekly')) {
      // This should be handled by subscription events, but just in case
      await handleSubscriptionEvent(userId, data, 'active');
    } else {
      // Handle one-time purchases (if you have any)
      console.log('One-time purchase for user:', userId);
    }
  } catch (error) {
    console.error('Error handling order event:', error);
    throw error;
  }
} 