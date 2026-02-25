/**
 * API endpoint to create a subscription for a user
 * Called after successful OAuth authentication
 */

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' })
    }

    const token = authHeader.substring(7)

    // Initialize Supabase client with user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )

    // Verify the token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Get subscription data from request body
    const { user_id, status, trial_ends_at, current_period_end, plan_type } = req.body

    // Verify user_id matches authenticated user
    if (user_id !== user.id) {
      return res.status(403).json({ error: 'User ID mismatch' })
    }

    // Check if subscription already exists
    const { data: existingSubscription, error: checkError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" - that's expected for new users
      throw checkError
    }

    if (existingSubscription) {
      // Subscription already exists, return it
      return res.status(200).json({
        success: true,
        subscription: existingSubscription,
        message: 'Subscription already exists'
      })
    }

    // Create new subscription
    const subscriptionData = {
      user_id: user.id,
      status: status || 'trial',
      trial_ends_at: trial_ends_at || null,
      current_period_end: current_period_end || null,
      plan_type: plan_type || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: newSubscription, error: insertError } = await supabase
      .from('subscriptions')
      .insert([subscriptionData])
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return res.status(201).json({
      success: true,
      subscription: newSubscription,
      message: 'Subscription created successfully'
    })

  } catch (error) {
    console.error('Create subscription error:', error)
    return res.status(500).json({
      error: error.message || 'Internal server error'
    })
  }
}
