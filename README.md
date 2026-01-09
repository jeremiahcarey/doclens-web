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
├── index.html              # Landing page
├── auth/
│   ├── signup.html        # Sign up page
│   ├── signin.html        # Sign in page
│   └── reset-password.html # Password reset (TODO)
├── account/
│   └── index.html         # Account management
├── styles/
│   ├── main.css           # Main styles
│   ├── auth.css           # Auth page styles
│   └── account.css        # Account page styles
├── scripts/
│   └── nav.js             # Navigation helpers
├── api/                   # Serverless functions (TODO)
│   ├── create-checkout.js # Stripe checkout
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
4. Update the following files with your Supabase credentials:
   - `auth/signup.html` (line 77-78)
   - `auth/signin.html` (line 67-68)
   - `account/index.html` (line 95-96)

### 3. Set Up Stripe

1. Create account at [stripe.com](https://stripe.com)
2. Get your test API keys from Dashboard → Developers → API keys
3. Create environment variables (see below)

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

1. User clicks "Sign Up" in extension popup
2. Opens `https://doclens.net/auth/signup`
3. User creates account (Supabase)
4. Website sends auth token to extension via `chrome.runtime.sendMessage()`
5. Extension saves token and closes tab
6. Extension now authenticated

## Database Schema

See `PRODUCTION_PLAN.md` in the extension repo for full schema.

Key tables:
- `subscriptions` - User subscription status
- `exported_documents` - Track exported docs (prevent duplicates)

## API Routes (TODO)

### `/api/create-checkout`
Creates Stripe checkout session for subscription.

### `/api/webhook`
Handles Stripe webhooks (subscription created/updated/canceled).

## Features

### Current (v1)
- ✅ Landing page with product info
- ✅ Sign up / sign in pages
- ✅ Basic account management page
- ✅ Supabase auth integration (placeholder)
- ✅ Responsive design

### Coming Soon (v2)
- [ ] Stripe checkout integration
- [ ] Webhook handling for subscriptions
- [ ] Export history display
- [ ] Password reset flow
- [ ] Email verification
- [ ] Customer portal for billing management

## Content Updates

### To Update Landing Page:
- Edit `index.html`
- Update sections: hero, features, testimonials, pricing, FAQ
- Deploy: `vercel --prod`

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
