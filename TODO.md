# DocLens Web - Implementation TODO

Last updated: January 15, 2026

## Current Status

**Frontend/Design: ✅ Complete**
- Landing page with screenshots and videos
- Privacy policy integrated
- Google OAuth authentication pages
- Dual signup flow (trial vs. paid)
- Pricing page with plan selection
- Pricing: $3.99/month or $29/year
- Deployed at doclens.net with custom domain

**Backend/Integration: ✅ Complete**
- ✅ Supabase project created
- ✅ Google OAuth client created (Web Application)
- ✅ Supabase credentials obtained and in .env.local
- ✅ lib/supabase.js configured
- ✅ Database tables created (profiles, subscriptions, exported_documents)
- ✅ Row Level Security (RLS) policies set up
- ✅ Auto-trigger for profile creation on signup
- ✅ Secret key obtained and added to .env.local
- ✅ API files updated to use modern secret key
- ✅ Auth pages fully working (signup, signin, callback, complete, success)
- ✅ All API endpoints implemented and deployed
- ✅ Stripe integration complete

---

## ✅ Priority 1: Authentication - COMPLETE

### Supabase Setup
- [x] Create Supabase project
- [x] Configure Google OAuth provider in Supabase
- [x] Get Supabase credentials (URL and anon key)
- [x] Create lib/supabase.js and configure
- [x] Auth pages activated and working
  - [x] `auth/signup.html` - Google OAuth signup
  - [x] `auth/signin.html` - Google OAuth signin
  - [x] `auth/callback.html` - OAuth callback handler
  - [x] `auth/complete.html` - Passes credentials to extension
  - [x] `auth/success.html` - Post-payment success page
- [x] Google OAuth flow tested end-to-end

### Database Schema
- [x] Create `profiles` table
- [x] Create `subscriptions` table
- [x] Create `exported_documents` table
- [x] Set up Row Level Security (RLS) policies
- [x] Create auto-trigger for profile creation on signup

---

## ✅ Priority 2: Stripe Integration - COMPLETE

### Stripe Setup
- [x] Using existing Stripe account
- [x] Created products and prices
  - [x] Monthly subscription: $3.99/month
  - [x] Annual subscription: $29/year
- [x] API keys configured in Vercel
  - [x] STRIPE_SECRET_KEY
  - [x] STRIPE_MONTHLY_PRICE_ID
  - [x] STRIPE_ANNUAL_PRICE_ID
  - [x] STRIPE_WEBHOOK_SECRET
  - [x] SITE_URL

### API Endpoints
- [x] `/api/create-checkout.js` - Creates Stripe checkout sessions
- [x] `/api/webhook.js` - Handles subscription lifecycle events
  - [x] checkout.session.completed
  - [x] customer.subscription.updated
  - [x] customer.subscription.deleted
  - [x] invoice.payment_failed
- [x] `/api/customer-portal.js` - Subscription management portal
- [x] `/api/check-subscription.js` - Returns subscription status
- [x] `/api/create-subscription.js` - Creates trial subscriptions

### Webhook Configuration
- [x] Endpoint: `https://www.doclens.net/api/webhook`
- [x] Events configured in Stripe Dashboard
- [x] Webhook signing secret configured

### Pages
- [x] `/pricing.html` - Plan selection and checkout
- [x] `/auth/success.html` - Post-payment confirmation

---

## ✅ Priority 3: Trial Management - COMPLETE

### Trial Logic
- [x] `/api/check-subscription.js` endpoint
  - [x] Returns subscription status (trial, active, expired, canceled)
  - [x] Calculates if trial expired
  - [x] Updates status to 'expired' if trial ended
- [x] Extension checks subscription on panel open
- [x] Features blocked when trial expired
- [x] Upgrade prompt shown for expired trials

---

## ✅ Priority 4: Account Management - COMPLETE

### Subscription Management
- [x] Customer Portal integration via Stripe
- [x] `/api/customer-portal.js` creates portal sessions
- [x] Users can cancel, update payment, view invoices
- [x] "Manage" link in extension panel for active subscribers

### Extension Integration
- [x] Extension receives auth tokens via content script
- [x] Tokens stored in chrome.storage.sync
- [x] Extension checks subscription before showing features
- [x] Service worker proxies API calls (avoids CORS)

---

## 👉 Priority 5: Launch Prep - IN PROGRESS

### Chrome Web Store Submission
- [ ] Create Chrome Web Store developer account ($5 fee)
- [ ] Prepare store listing
  - [ ] Screenshots (1280x800 or 640x400)
  - [ ] Description (up to 132 characters for short, detailed for long)
  - [ ] Promo images (optional: 440x280 small, 920x680 large)
  - [ ] Category selection
- [ ] Package extension as .zip
- [ ] Submit for review

### Production Checklist
- [x] Stripe using live mode keys
- [x] All environment variables in Vercel
- [x] Domain configured (doclens.net)
- [x] SSL certificate (automatic with Vercel)
- [ ] Test with fresh Google account (full flow)
- [ ] Review error handling

---

## Priority 6: Nice-to-Have Features (Future)

### Potential Improvements
- [ ] Add "Upgrade" button to trial status bar
- [ ] Email notifications (trial expiring, payment failed)
- [ ] Account page on website showing subscription details
- [ ] Analytics (signup conversion, trial-to-paid conversion)
- [ ] Admin dashboard for user management
- [ ] School/district bulk purchasing

---

## Technical Notes

### Important URLs
- Website: https://doclens.net
- Webhook: https://www.doclens.net/api/webhook (must use www!)
- Pricing: https://doclens.net/pricing

### Webhook Gotcha
The webhook endpoint must use `www.doclens.net` because `doclens.net` returns a 307 redirect, which Stripe doesn't follow.

### Subscription Flow
1. User signs up via Google OAuth → trial subscription created
2. User upgrades via /pricing → Stripe checkout
3. Stripe webhook → updates subscription to 'active'
4. Extension checks status → shows appropriate UI

### Auth Flow
1. User clicks "Try Free" in extension → opens signup page
2. Google OAuth → callback.html creates subscription
3. Redirect to complete.html with credentials in URL
4. Content script (auth-receiver.js) captures and stores in chrome.storage
5. Extension panel checks storage and subscription API
