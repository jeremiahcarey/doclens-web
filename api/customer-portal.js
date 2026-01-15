/**
 * Create Stripe Customer Portal Session
 *
 * Endpoint: /api/customer-portal
 * Method: POST
 *
 * Creates a Stripe customer portal session for managing subscriptions.
 * Users can cancel, update payment method, view invoices, etc.
 *
 * Request Body:
 * {
 *   userId: string  // Supabase user ID
 * }
 *
 * Response:
 * {
 *   url: string  // Redirect URL to Stripe customer portal
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Get customer ID from database
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (error || !subscription?.stripe_customer_id) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.SITE_URL || 'https://doclens.net'}`,
    });

    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('Customer portal error:', error);
    return res.status(500).json({
      error: 'Failed to create portal session',
      message: error.message
    });
  }
}
