/**
 * Check Subscription Status
 *
 * Endpoint: /api/check-subscription
 * Method: GET
 *
 * Called by the Chrome extension to check if user has active subscription.
 * Used to determine if user can access premium features.
 *
 * Query Parameters:
 * - userId: Supabase user ID
 *
 * Response:
 * {
 *   status: 'trial' | 'active' | 'expired' | 'canceled' | 'past_due',
 *   hasAccess: boolean,
 *   trialEndsAt: string | null,
 *   currentPeriodEnd: string | null,
 *   planType: 'monthly' | 'annual' | null
 * }
 */

// TODO: Uncomment and configure when ready to implement

/*
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    // Get subscription from database
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !subscription) {
      // No subscription found - user has never signed up
      return res.status(200).json({
        status: 'none',
        hasAccess: false,
        trialEndsAt: null,
        currentPeriodEnd: null,
        planType: null
      });
    }

    // Check if trial has expired
    let status = subscription.status;
    if (status === 'trial' && subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at);
      if (trialEnd < new Date()) {
        status = 'expired';

        // Update status in database
        await supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('user_id', userId);
      }
    }

    // Determine if user has access
    const hasAccess = status === 'trial' || status === 'active';

    return res.status(200).json({
      status,
      hasAccess,
      trialEndsAt: subscription.trial_ends_at,
      currentPeriodEnd: subscription.current_period_end,
      planType: subscription.plan_type
    });

  } catch (error) {
    console.error('Check subscription error:', error);
    return res.status(500).json({
      error: 'Failed to check subscription',
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
