# DocLens Website

Website and authentication pages for [DocLens](https://doclens.net) - a Chrome extension for understanding student writing processes in Google Docs.

## Overview

This repo contains:
- Landing page with product information
- Authentication pages (signup, signin, account management)
- Integration with Supabase for user management
- Integration with Stripe for payments
- API routes for webhooks

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **Backend**: Vercel Serverless Functions
- **Auth**: Supabase
- **Payments**: Stripe
- **Hosting**: Vercel

## Project Structure

```
doclens-web/
├── index.html              # Landing page with privacy policy
├── auth/
│   ├── signup.html        # Sign up with Google OAuth
│   └── signin.html        # Sign in with Google OAuth
├── account/
│   └── index.html         # Account management
├── images/
│   ├── button.png         # How It Works: DocLens button screenshot
│   ├── playback.mp4       # How It Works: Playback video
│   ├── export.mp4         # How It Works: Export video
│   └── favicon.*          # Favicon files
├── styles/
│   ├── main.css           # Main styles
│   ├── auth.css           # Auth page styles (with Google button)
│   └── account.css        # Account page styles
├── scripts/
│   └── nav.js             # Navigation helpers
├── api/                   # Serverless functions (TODO)
│   ├── create-checkout.js # Stripe checkout for paid signup
│   └── webhook.js         # Stripe webhooks
├── vercel.json            # Vercel config
└── package.json
```

## Development Setup

### Prerequisites

- Node.js 18+ installed
- Supabase account (free tier)
- Stripe account (test mode)
- Vercel account (free tier)

### 1. Clone and Install

```bash
git clone https://github.com/your-username/doclens-web.git
cd doclens-web
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API
3. Copy your project URL and anon key
4. **Enable Google OAuth Provider:**
   - Go to Authentication → Providers
   - Enable Google
   - Add OAuth credentials from Google Cloud Console
   - Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`
5. Update the following files with your Supabase credentials:
   - `auth/signup.html` (search for `SUPABASE_URL` and `SUPABASE_ANON_KEY`)
   - `auth/signin.html` (search for `SUPABASE_URL` and `SUPABASE_ANON_KEY`)
   - `account/index.html` (search for `SUPABASE_URL` and `SUPABASE_ANON_KEY`)

### 3. Set Up Stripe

1. Create account at [stripe.com](https://stripe.com)
2. Get your test API keys from Dashboard → Developers → API keys
3. Create two products/prices:
   - **Monthly Plan**: $5/month recurring
   - **Annual Plan**: $40/year recurring
4. Create environment variables (see below)

### 4. Environment Variables

Create `.env` file (not committed to git):

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...  # $5/month price ID
STRIPE_ANNUAL_PRICE_ID=price_...   # $40/year price ID

# Other
NODE_ENV=development
```

For Vercel deployment, add these in Vercel dashboard → Settings → Environment Variables.

### 5. Run Locally

```bash
npm run dev
```

Opens at `http://localhost:3000`

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Configure Domain

1. In Vercel dashboard, go to your project
2. Settings → Domains
3. Add `doclens.net` and `www.doclens.net`
4. Update DNS records at your domain registrar:
   - A record: `@` → `76.76.21.21`
   - CNAME: `www` → `cname.vercel-dns.com`

## Integration with Chrome Extension

The website communicates with the Chrome extension using `chrome.runtime.sendMessage()`.

### In manifest.json (extension repo):

```json
{
  "externally_connectable": {
    "matches": [
      "https://doclens.net/*",
      "https://*.doclens.net/*"
    ]
  }
}
```

### Authentication Flow:

DocLens uses **Google OAuth exclusively** - no email/password authentication.

**Trial Signup (No Credit Card):**
1. User clicks "Try Free for 14 Days" → Opens `/auth/signup?trial=true`
2. Clicks "Sign in with Google" → Google OAuth flow
3. Confirms they are a teacher
4. Account created with 14-day trial
5. Website sends auth token to extension via `chrome.runtime.sendMessage()`
6. Extension saves token and user is authenticated

**Paid Signup (Immediate):**
1. User clicks "Sign Up Now" → Opens `/auth/signup`
2. Clicks "Sign in with Google" → Google OAuth flow
3. Confirms they are a teacher
4. Redirected to Stripe checkout for payment
5. After payment, auth token sent to extension
6. Extension saves token and subscription active

**Sign In:**
1. User clicks "Sign In" → Opens `/auth/signin`
2. Clicks "Sign in with Google" → Google OAuth flow
3. Website sends auth token to extension
4. Extension authenticated

## Database Schema

See `PRODUCTION_PLAN.md` in the extension repo for full schema.

Key tables:
- `subscriptions` - User subscription status
- `exported_documents` - Track exported docs (prevent duplicates)

## API Routes (TODO)

### `/api/create-checkout`
Creates Stripe checkout session for paid signup.
- Accepts `userId` and `priceId` (monthly or annual)
- Creates checkout session with 14-day trial for immediate signups
- Returns session URL for redirect

### `/api/webhook`
Handles Stripe webhooks:
- `checkout.session.completed` - Activate subscription after payment
- `customer.subscription.updated` - Update subscription status
- `customer.subscription.deleted` - Handle cancellation
- Updates `subscriptions` table in Supabase

## Features

### Current (v1)
- ✅ Landing page with product info, screenshots, and videos
- ✅ Privacy policy integrated into main page
- ✅ Two pricing options: $5/month or $40/year
- ✅ Dual signup flow: free trial (no CC) or paid (with CC)
- ✅ Google OAuth authentication (sign up and sign in)
- ✅ Basic account management page
- ✅ Teacher verification checkbox
- ✅ Responsive design
- ✅ Favicon and branding

### Coming Soon (v2)
- [ ] Complete Supabase OAuth setup
- [ ] Stripe checkout integration for paid signup
- [ ] Webhook handling for subscriptions
- [ ] Trial expiration handling (14 days)
- [ ] Export history display in account page
- [ ] Stripe Customer Portal for billing management
- [ ] Subscription upgrade/downgrade (monthly ↔ annual)
- [ ] Google Sheets integration status in account page

## Content Updates

### To Update Landing Page:
- Edit `index.html`
- Sections available: hero, how-it-works, features, testimonials, pricing, FAQ, privacy
- Privacy policy is integrated into main page (section id: `privacy`)
- Deploy: `vercel --prod`

### To Update Pricing:
- Update amounts in `index.html` pricing section
- Update `STRIPE_MONTHLY_PRICE_ID` and `STRIPE_ANNUAL_PRICE_ID` environment variables
- Update FAQ section if pricing changes

### To Update Screenshots/Videos:
- Replace files in `images/` directory
- Videos should be MP4 format (H.264 codec) for best compatibility
- Keep file sizes small for fast loading (under 3MB per video)
- Current files:
  - `button.png` - DocLens button in Google Docs
  - `playback.mp4` - Writing process playback demo
  - `export.mp4` - Grading and export demo

### To Update Styles:
- Edit CSS files in `styles/`
- Changes take effect immediately on next deploy

## Security

- All sensitive keys in environment variables (never committed)
- CORS configured for extension communication
- Supabase Row Level Security (RLS) enabled on all tables
- Stripe webhooks verified with signature
- HTTPS only (enforced by Vercel)

## Support

For issues or questions:
- Email: support@doclens.net
- Extension repo: [doc-lens](https://github.com/your-username/doc-lens)

## License

MIT License - see LICENSE file for details
