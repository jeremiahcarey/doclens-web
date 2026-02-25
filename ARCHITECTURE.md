# DocLens Architecture

Overview of how the DocLens website, extension, and backend services work together.

## System Overview

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Chrome         │      │  DocLens         │      │  Backend        │
│  Extension      │◄────►│  Website         │◄────►│  Services       │
│                 │      │  (doclens.net)   │      │                 │
└─────────────────┘      └──────────────────┘      └─────────────────┘
        │                         │                          │
        │                         │                          │
        ▼                         ▼                          ▼
   Local Doc                 Supabase                    Stripe
   Analysis                  (Auth & DB)              (Payments)
```

## Components

### 1. Chrome Extension (Separate Repo)
**Purpose:** Analyze Google Docs revision history and display results

**Features:**
- Adds DocLens button to Google Docs toolbar
- Fetches document revision history via Google Docs API
- Analyzes writing patterns locally (client-side)
- Displays playback interface
- Handles grading and Google Sheets export

**Authentication:**
- Receives auth token from website via `chrome.runtime.sendMessage()`
- Stores token in `chrome.storage`
- Includes token in API requests to check subscription

**Subscription Check:**
- Before analysis: Calls `/api/check-subscription`
- If expired/canceled: Shows upgrade prompt
- If active/trial: Allows full access

### 2. Website (This Repo)
**Purpose:** Marketing, authentication, and account management

**Pages:**
- `/` - Landing page with product info, pricing, privacy policy
- `/auth/signup.html` - Sign up with Google OAuth (trial or paid)
- `/auth/signin.html` - Sign in with Google OAuth
- `/account/` - Account management, subscription status, billing

**Features:**
- Google OAuth authentication (no password)
- Dual signup flow: free trial (no CC) or immediate paid (with CC)
- Communicates auth token to extension
- Redirects to Stripe for payment
- Customer portal for billing management

### 3. Supabase (Auth & Database)
**Purpose:** User authentication and data storage

**Authentication:**
- Google OAuth provider configured
- Handles OAuth flow and token management
- Provides session tokens to extension

**Database Tables:**
```sql
-- User profiles
profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  email text,
  is_teacher boolean,
  created_at timestamp
)

-- Subscription status
subscriptions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text, -- 'trial', 'active', 'expired', 'canceled', 'past_due'
  plan_type text, -- 'monthly' or 'annual'
  trial_ends_at timestamp,
  current_period_end timestamp,
  created_at timestamp,
  updated_at timestamp
)

-- Prevent duplicate exports
exported_documents (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles,
  document_id text,
  exported_at timestamp
)
```

**Row Level Security (RLS):**
- Users can only access their own data
- Service role bypasses RLS for API operations

### 4. Stripe (Payments)
**Purpose:** Subscription billing and payment processing

**Products:**
- Monthly Plan: $3.99/month
- Annual Plan: $29/year
- Both include 14-day trial for paid signups

**Webhooks:**
- `checkout.session.completed` → Subscription activated
- `customer.subscription.updated` → Status changed
- `customer.subscription.deleted` → Subscription canceled
- `invoice.payment_failed` → Payment issue

**Customer Portal:**
- Users can update payment method
- Cancel subscription
- View billing history

## Authentication & Signup Flows

### Flow 1: Free Trial Signup (No Credit Card)

```
1. User clicks "Try Free for 14 Days"
   ↓
2. Opens /auth/signup?trial=true
   ↓
3. Clicks "Sign in with Google"
   ↓
4. Google OAuth flow (redirects to Google)
   ↓
5. Returns to callback URL with auth code
   ↓
6. Supabase exchanges code for session
   ↓
7. User confirms they are a teacher
   ↓
8. Profile created in database:
   - status: 'trial'
   - trial_ends_at: now() + 14 days
   ↓
9. Website sends token to extension via chrome.runtime.sendMessage()
   ↓
10. Extension stores token in chrome.storage
    ↓
11. User has full access for 14 days
    ↓
12. After 14 days: status → 'expired'
    ↓
13. Extension prompts user to subscribe
```

### Flow 2: Paid Signup (Immediate Subscription)

```
1. User clicks "Sign Up Now"
   ↓
2. Opens /auth/signup (no trial param)
   ↓
3. Clicks "Sign in with Google"
   ↓
4. Google OAuth flow
   ↓
5. Returns with session
   ↓
6. User confirms they are a teacher
   ↓
7. Redirected to /api/create-checkout
   - Creates Stripe customer
   - Creates checkout session
   - Returns checkout URL
   ↓
8. Redirected to Stripe Checkout
   ↓
9. User enters payment info
   ↓
10. Stripe processes payment
    ↓
11. Webhook: checkout.session.completed
    - Database updated:
      - status: 'active'
      - stripe_subscription_id: xxx
      - trial_ends_at: now() + 14 days (Stripe trial)
    ↓
12. Redirected to success page
    ↓
13. Website sends token to extension
    ↓
14. Extension stores token
    ↓
15. User has immediate access
```

### Flow 3: Sign In (Existing User)

```
1. User clicks "Sign In"
   ↓
2. Opens /auth/signin
   ↓
3. Clicks "Sign in with Google"
   ↓
4. Google OAuth flow
   ↓
5. Returns with session
   ↓
6. Website sends token to extension
   ↓
7. Extension stores token
   ↓
8. Extension calls /api/check-subscription
   ↓
9. Gets subscription status
   ↓
10. If active/trial: Full access
    If expired/canceled: Upgrade prompt
```

## Data Flow

### Document Analysis (Extension Only)
```
1. User opens Google Doc
   ↓
2. Extension adds DocLens button
   ↓
3. User clicks button
   ↓
4. Extension checks subscription:
   - Calls /api/check-subscription with userId
   - If expired: Shows upgrade message
   - If active/trial: Continues
   ↓
5. Extension fetches revision history from Google Docs API
   ↓
6. Extension analyzes revisions locally (client-side)
   ↓
7. Extension displays playback interface
   ↓
8. User interacts with playback controls
```

### Grading & Export (Extension Only)
```
1. User enters grade/comments in extension UI
   ↓
2. User clicks "Export to Google Sheets"
   ↓
3. Extension checks if document already exported:
   - Queries exported_documents table
   - If found: Shows "already exported" warning
   ↓
4. Extension uses Google Sheets API:
   - Finds or creates target spreadsheet
   - Appends new row with data
   ↓
5. Extension records export:
   - Inserts row into exported_documents table
   - Prevents duplicate exports
   ↓
6. Shows success message
```

### Subscription Check (Extension)
```
Extension startup or before analysis:
   ↓
GET /api/check-subscription?userId=xxx
   ↓
API queries Supabase subscriptions table
   ↓
Checks if trial expired (if status='trial')
   ↓
Returns:
{
  status: 'trial' | 'active' | 'expired' | 'canceled',
  hasAccess: true/false,
  trialEndsAt: '2026-01-23T...',
  currentPeriodEnd: '2026-02-09T...',
  planType: 'monthly'
}
   ↓
Extension uses hasAccess to enable/disable features
```

## Security

### API Security
- All API endpoints verify authentication
- Supabase service role key kept server-side only
- Stripe webhook signatures verified
- HTTPS enforced by Vercel
- CORS configured for extension communication

### Data Privacy
- Document content never sent to servers
- All analysis happens client-side in extension
- Only document IDs stored (for duplicate prevention)
- User can't access other users' data (RLS policies)
- Stripe handles PCI compliance for payments

### Extension Security
- OAuth tokens stored in chrome.storage (encrypted by Chrome)
- Extension only communicates with doclens.net
- Specified in manifest.json externally_connectable
- Content scripts isolated per-tab

## Environment Variables

Required for production:

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_MONTHLY_PRICE_ID=price_xxx
STRIPE_ANNUAL_PRICE_ID=price_xxx

# Site
SITE_URL=https://doclens.net
```

## Deployment

### Website (Vercel)
```bash
# Connect to Vercel
vercel link

# Deploy to production
vercel --prod

# Environment variables set in Vercel dashboard
```

### Extension (Chrome Web Store)
1. Build extension: `npm run build`
2. Upload to Chrome Web Store Developer Dashboard
3. Wait for review approval (~1-3 days)
4. Published to Chrome Web Store

### Supabase (Cloud)
- Database hosted on Supabase cloud
- Automatic backups
- Connection pooling enabled
- RLS policies active

### Stripe (Cloud)
- Live mode keys in production
- Webhooks configured
- Tax collection (optional)

## Monitoring

### What to Monitor
- API endpoint errors (500s)
- Webhook failures (check Stripe dashboard)
- Trial expiration job (if implemented)
- Subscription status mismatches
- User signup/conversion rates

### Error Handling
- API errors logged to console
- Extension errors shown to user
- Stripe webhook failures retried automatically
- Failed payments trigger webhooks

## Future Enhancements

### Phase 1 (MVP)
- ✅ Authentication with Google OAuth
- ✅ Free trial and paid signups
- ✅ Subscription management via Stripe
- ✅ Landing page with pricing
- ✅ Privacy policy

### Phase 2
- [ ] Email notifications (trial expiring, payment failed)
- [ ] Admin dashboard for user management
- [ ] Usage analytics and reporting
- [ ] School/district bulk licensing

### Phase 3
- [ ] Referral program
- [ ] Team accounts for departments
- [ ] Advanced analytics (writing patterns over time)
- [ ] Integration with Learning Management Systems (LMS)

## Support

For questions or issues:
- Email: support@doclens.net
- Extension repo: [doc-lens](https://github.com/your-username/doc-lens)
- Website repo: [doclens-web](https://github.com/your-username/doclens-web)
