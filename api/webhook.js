/**
 * Stripe Webhook Handler
 *
 * Endpoint: /api/webhook
 * Method: POST
 *
 * Handles Stripe webhook events for subscription lifecycle.
 * Must be configured in Stripe Dashboard with this endpoint URL.
 *
 * Events Handled:
 * - checkout.session.completed: Subscription created after payment
 * - customer.subscription.updated: Subscription status changed
 * - customer.subscription.deleted: Subscription canceled
 *
 * Important: Vercel requires raw body for webhook signature verification.
 * Add to vercel.json:
 * {
 *   "api": {
 *     "bodyParser": false
 *   }
 * }
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export const config = {
  api: {
    bodyParser: false, // Required for webhook signature verification
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.supabase_user_id;
        const subscriptionId = session.subscription;

        if (userId && subscriptionId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          // Update database
          await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              stripe_customer_id: session.customer,
              stripe_subscription_id: subscriptionId,
              status: 'active',
              plan_type: subscription.items.data[0].price.id === process.env.STRIPE_ANNUAL_PRICE_ID ? 'annual' : 'monthly',
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            });

          console.log('Subscription created:', subscriptionId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata.supabase_user_id;

        if (userId) {
          await supabase
            .from('subscriptions')
            .update({
              status: subscription.status,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            })
            .eq('stripe_subscription_id', subscription.id);

          console.log('Subscription updated:', subscription.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
          })
          .eq('stripe_subscription_id', subscription.id);

        console.log('Subscription canceled:', subscription.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'past_due',
            })
            .eq('stripe_subscription_id', subscriptionId);

          console.log('Payment failed for subscription:', subscriptionId);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({
      error: 'Webhook handler failed',
      message: error.message
    });
  }
}
