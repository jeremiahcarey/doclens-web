# DocLens Web - Implementation TODO

Last updated: January 9, 2026

## Current Status

**Frontend/Design: ✅ Complete**
- Landing page with screenshots and videos
- Privacy policy integrated
- Google OAuth authentication pages
- Dual signup flow (trial vs. paid)
- Pricing: $5/month or $40/year

**Backend/Integration: 🚧 In Progress**

---

## Priority 1: Authentication (Required for MVP)

### Supabase Setup
- [ ] Create Supabase project
- [ ] Configure Google OAuth provider in Supabase
  - [ ] Set up Google Cloud Console OAuth credentials
  - [ ] Configure authorized redirect URIs
  - [ ] Add client ID and secret to Supabase
- [ ] Update auth pages with Supabase credentials
  - [ ] `auth/signup.html` - Add URL and anon key
  - [ ] `auth/signin.html` - Add URL and anon key
  - [ ] `account/index.html` - Add URL and anon key
- [ ] Test Google OAuth flow end-to-end
  - [ ] Trial signup (no CC)
  - [ ] Paid signup (with CC)
  - [ ] Sign in

### Database Schema
- [ ] Create `profiles` table
  ```sql
  - id (uuid, references auth.users)
  - email (text)
  - is_teacher (boolean)
  - created_at (timestamp)
  ```
- [ ] Create `subscriptions` table
  ```sql
  - id (uuid, primary key)
  - user_id (uuid, references profiles)
  - stripe_customer_id (text)
  - stripe_subscription_id (text)
  - status (text) - 'trial', 'active', 'canceled', 'expired'
  - plan_type (text) - 'monthly' or 'annual'
  - trial_ends_at (timestamp)
  - current_period_end (timestamp)
  - created_at (timestamp)
  ```
- [ ] Create `exported_documents` table
  ```sql
  - id (uuid, primary key)
  - user_id (uuid, references profiles)
  - document_id (text)
  - exported_at (timestamp)
  ```
- [ ] Set up Row Level Security (RLS) policies
  - [ ] Users can only read/write their own data
  - [ ] Service role can access everything

---

## Priority 2: Stripe Integration (Required for Paid Signups)

### Stripe Setup
- [ ] Create Stripe account (or use existing)
- [ ] Create products and prices
  - [ ] Monthly subscription: $5/month
  - [ ] Annual subscription: $40/year
  - [ ] Both with 14-day trial period (for paid signups)
- [ ] Get API keys (test mode first)
  - [ ] Secret key
  - [ ] Publishable key
  - [ ] Webhook signing secret
- [ ] Add environment variables to Vercel
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_PUBLISHABLE_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] `STRIPE_MONTHLY_PRICE_ID`
  - [ ] `STRIPE_ANNUAL_PRICE_ID`

### API Endpoints
- [ ] Create `/api/create-checkout.js`
  - [ ] Accept `userId` and `priceId` parameters
  - [ ] Create Stripe customer if doesn't exist
  - [ ] Create checkout session with trial
  - [ ] Return session URL
  - [ ] Handle errors
- [ ] Create `/api/webhook.js`
  - [ ] Verify webhook signature
  - [ ] Handle `checkout.session.completed`
    - [ ] Create/update subscription in database
    - [ ] Set status to 'active'
  - [ ] Handle `customer.subscription.updated`
    - [ ] Update subscription status
    - [ ] Update current_period_end
  - [ ] Handle `customer.subscription.deleted`
    - [ ] Set status to 'canceled'
  - [ ] Return 200 OK
- [ ] Configure webhook endpoint in Stripe dashboard
  - [ ] Add `https://doclens.net/api/webhook` as endpoint
  - [ ] Select relevant events
  - [ ] Get webhook signing secret

### Signup Flow Updates
- [ ] Update `auth/signup.html` to handle paid signups
  - [ ] After Google OAuth, check if `?trial=true`
  - [ ] If trial: create profile with trial status, done
  - [ ] If paid: redirect to Stripe checkout
  - [ ] Handle success/cancel callbacks
- [ ] Create success page for after checkout
  - [ ] Show "Payment successful!" message
  - [ ] Auto-close tab or redirect to extension

---

## Priority 3: Trial Management

### Trial Expiration Logic
- [ ] Create `/api/check-trial.js` endpoint
  - [ ] Accept user ID
  - [ ] Check if trial expired
  - [ ] Return subscription status
- [ ] Extension should call this on startup
  - [ ] If trial expired, show upgrade prompt
  - [ ] Block analysis features until subscribed

### Trial Expiration Handling
- [ ] Create Supabase Edge Function or cron job
  - [ ] Run daily
  - [ ] Find users where `trial_ends_at < now()`
  - [ ] Update status to 'expired'
  - [ ] Send email notification (optional)
- [ ] Alternatively: Use Stripe Billing to handle trials
  - [ ] Create subscription at trial start
  - [ ] Let Stripe handle trial expiration
  - [ ] Use webhooks to update database

---

## Priority 4: Account Management

### Account Page
- [ ] Update `account/index.html`
  - [ ] Display current subscription status
  - [ ] Show trial end date if on trial
  - [ ] Show next billing date if subscribed
  - [ ] Display plan type (monthly/annual)
- [ ] Add "Manage Billing" button
  - [ ] Redirect to Stripe Customer Portal
  - [ ] Create `/api/create-portal-session.js`
  - [ ] Return portal URL for redirect
- [ ] Show export history
  - [ ] Query `exported_documents` table
  - [ ] Display list with document IDs and dates
  - [ ] Add pagination if needed

### Extension Integration
- [ ] Update extension to communicate with website
  - [ ] Send auth token to extension after signup/signin
  - [ ] Extension stores token in chrome.storage
  - [ ] Extension includes token in API requests
- [ ] Add subscription check to extension
  - [ ] Before allowing analysis, check subscription
  - [ ] Call `/api/check-trial.js` or check locally
  - [ ] Block features if expired/canceled

---

## Priority 5: Testing & Launch Prep

### Testing
- [ ] Test free trial signup flow
  - [ ] OAuth works
  - [ ] Profile created in database
  - [ ] Trial period set correctly
  - [ ] Extension receives token
- [ ] Test paid signup flow
  - [ ] OAuth works
  - [ ] Redirect to Stripe works
  - [ ] Subscription created after payment
  - [ ] Extension receives token
- [ ] Test webhooks
  - [ ] Subscription created
  - [ ] Subscription updated
  - [ ] Subscription canceled
  - [ ] Database updates correctly
- [ ] Test trial expiration
  - [ ] Features blocked after expiration
  - [ ] User prompted to upgrade
- [ ] Test Customer Portal
  - [ ] Can update payment method
  - [ ] Can cancel subscription
  - [ ] Can switch between monthly/annual

### Production Checklist
- [ ] Switch Stripe to live mode
  - [ ] Update API keys
  - [ ] Update price IDs
  - [ ] Configure live webhook endpoint
- [ ] Switch Supabase to production
  - [ ] Review RLS policies
  - [ ] Set up database backups
- [ ] Configure domain
  - [ ] Point doclens.net to Vercel
  - [ ] Add SSL certificate (automatic with Vercel)
  - [ ] Test all pages load correctly
- [ ] Update extension manifest
  - [ ] Add `https://doclens.net/*` to externally_connectable
  - [ ] Publish to Chrome Web Store
- [ ] Create support email: support@doclens.net
- [ ] Set up error monitoring (optional)
  - [ ] Sentry or similar
  - [ ] Track API errors
  - [ ] Track webhook failures

---

## Priority 6: Nice-to-Have Features

### Future Enhancements
- [ ] Email notifications
  - [ ] Trial expiring soon (3 days before)
  - [ ] Trial expired
  - [ ] Payment failed
  - [ ] Subscription canceled
- [ ] Analytics
  - [ ] Track signup conversion rates
  - [ ] Track trial-to-paid conversion
  - [ ] Monitor monthly churn
- [ ] Admin dashboard
  - [ ] View all users
  - [ ] Subscription statistics
  - [ ] Export history
- [ ] Referral program
  - [ ] Give free month for referrals
  - [ ] Track referral codes
- [ ] School/district features
  - [ ] Bulk user management
  - [ ] Purchase orders
  - [ ] Custom data privacy agreements
  - [ ] Usage reports

---

## Notes

### Subscription Model Decision
We're using a **hybrid approach**:
- **Free Trial (No CC)**: 14 days full access, no payment info required
  - Tracked in database with `trial_ends_at` timestamp
  - Status: 'trial' → 'expired' after 14 days
  - User must add payment to continue

- **Paid Signup (With CC)**: Immediate subscription via Stripe
  - Stripe handles billing and trial (14 days)
  - Status: 'active' from the start
  - Stripe webhooks keep database in sync

This gives users flexibility while simplifying the no-CC trial implementation.

### Authentication Flow
Using **Google OAuth only** because:
- All users have Google accounts (required for Google Docs)
- Simpler UX (no password to remember)
- Better security (Google handles 2FA, recovery, etc.)
- Industry standard for Google Workspace extensions

### Pricing Rationale
- **$5/month**: Affordable for individual teachers
- **$40/year**: Save $20 (33% discount) to encourage annual commitments
- Lower than Draftback and competitors
- Appeals to education market (price-sensitive)
