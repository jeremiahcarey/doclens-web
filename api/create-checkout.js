/**
 * Create Stripe Checkout Session
 *
 * Endpoint: /api/create-checkout
 * Method: POST
 *
 * Creates a Stripe checkout session for paid subscriptions.
 * Called when users upgrade from the pricing page.
 *
 * Request Body:
 * {
 *   userId: string,      // Supabase user ID
 *   priceId: string,     // 'monthly' or 'annual'
 *   email: string        // User's email
 * }
 *
 * Response:
 * {
 *   sessionId: string,   // Stripe checkout session ID
 *   url: string          // Redirect URL to Stripe checkout
 * }
 */

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

    if (!stripePriceId) {
      return res.status(500).json({ error: 'Stripe price not configured' });
    }

    // Check if user already has a Stripe customer ID
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    let customerId = subscription?.stripe_customer_id;

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
        .update({ stripe_customer_id: customerId })
        .eq('user_id', userId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{
        price: stripePriceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.SITE_URL || 'https://doclens.net'}/auth/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL || 'https://doclens.net'}/pricing.html`,
      metadata: {
        supabase_user_id: userId
      },
      subscription_data: {
        metadata: {
          supabase_user_id: userId
        }
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
