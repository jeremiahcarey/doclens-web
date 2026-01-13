/**
 * Create Stripe Checkout Session
 *
 * Endpoint: /api/create-checkout
 * Method: POST
 *
 * Creates a Stripe checkout session for paid subscriptions.
 * This is called when users choose "Sign Up Now" instead of free trial.
 *
 * Request Body:
 * {
 *   userId: string,      // Supabase user ID
 *   priceId: string,     // 'monthly' or 'annual'
 *   email: string        // User's Google email
 * }
 *
 * Response:
 * {
 *   sessionId: string,   // Stripe checkout session ID
 *   url: string          // Redirect URL to Stripe checkout
 * }
 */

// TODO: Uncomment and configure when ready to implement

/*
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, priceId, email } = req.body;

    // Validate input
    if (!userId || !priceId || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get Stripe price ID from environment
    const stripePriceId = priceId === 'annual'
      ? process.env.STRIPE_ANNUAL_PRICE_ID
      : process.env.STRIPE_MONTHLY_PRICE_ID;

    // Check if user already has a Stripe customer ID
    const { data: profile } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          supabase_user_id: userId
        }
      });
      customerId = customer.id;

      // Save customer ID to database
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          status: 'pending'
        });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{
        price: stripePriceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.SITE_URL}/auth/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/auth/signup`,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          supabase_user_id: userId
        }
      },
      metadata: {
        supabase_user_id: userId
      }
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message
    });
  }
}
*/

// Placeholder response for now
export default async function handler(req, res) {
  return res.status(501).json({
    error: 'Not implemented yet',
    message: 'See TODO.md for implementation steps'
  });
}
