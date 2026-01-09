# DocLens Pricing & Subscription Model

## Pricing Structure

### Individual Teacher Plans

| Plan | Price | Savings | Billing |
|------|-------|---------|---------|
| **Monthly** | $5/month | - | Charged monthly |
| **Annual** | $40/year | $20/year (33%) | Charged annually |

### School/District Plans
- Custom pricing based on number of teachers
- Volume discounts available
- Purchase order payment options
- Custom data privacy agreements
- Contact: support@doclens.net

## Signup Options

We offer **two signup paths** to give users flexibility:

### Option 1: Try Free for 14 Days (No Credit Card)
- Full access to all features for 14 days
- No credit card required
- No automatic charge at end of trial
- After 14 days:
  - Features blocked until subscription added
  - User prompted to subscribe
  - No data lost
- **Ideal for:** Teachers who want to test thoroughly before committing

### Option 2: Sign Up Now (Credit Card Required)
- Enter payment information upfront
- Still get 14-day trial (via Stripe)
- Automatically converts to paid after trial
- Can cancel anytime during trial with no charge
- **Ideal for:** Teachers ready to commit immediately

## Trial Details

### Free Trial (No CC)
- **Duration:** 14 days from signup
- **Access:** Full access to all features
- **Payment:** Not collected
- **After trial:** Features blocked, user must add payment to continue
- **Database status:** `status='trial'` → `status='expired'`
- **Implementation:** Tracked in database with `trial_ends_at` timestamp

### Paid Signup Trial (With CC)
- **Duration:** 14 days from signup
- **Access:** Full access to all features
- **Payment:** Card authorized but not charged until trial ends
- **After trial:** Automatically charged monthly/annually
- **Cancel:** Anytime during trial with no charge
- **Database status:** `status='active'` from the start
- **Implementation:** Handled by Stripe subscription trial

## Feature Access

| Feature | Free Trial | Active | Expired | Canceled |
|---------|-----------|--------|---------|----------|
| Document Analysis | ✅ | ✅ | ❌ | ❌ |
| Revision Playback | ✅ | ✅ | ❌ | ❌ |
| Writing Pattern Analysis | ✅ | ✅ | ❌ | ❌ |
| Grading | ✅ | ✅ | ❌ | ❌ |
| Google Sheets Export | ✅ | ✅ | ❌ | ❌ |
| Account Access | ✅ | ✅ | ✅ | ✅ |
| Billing Management | ❌ | ✅ | ✅ | ✅ |

## Subscription States

### Status: `trial`
- User in free 14-day trial (no CC)
- Full feature access
- `trial_ends_at` timestamp set
- No Stripe subscription

### Status: `active`
- User has paid subscription
- Full feature access
- Stripe subscription ID present
- Automatically renews

### Status: `expired`
- Free trial ended, no payment added
- Features blocked
- Can upgrade anytime
- Data preserved

### Status: `canceled`
- User canceled subscription
- Access until `current_period_end`
- Then features blocked
- Can resubscribe anytime

### Status: `past_due`
- Payment failed
- Features still accessible (grace period)
- Stripe retrying payment
- User notified to update payment method

## Payment Flow

### Free Trial User Upgrading
```
1. Trial expires (14 days)
   ↓
2. Extension shows "Trial Expired" message
   ↓
3. User clicks "Subscribe"
   ↓
4. Opens account page
   ↓
5. Selects plan (monthly or annual)
   ↓
6. Redirected to Stripe Checkout
   ↓
7. Enters payment information
   ↓
8. Stripe processes payment
   ↓
9. Webhook updates database: status → 'active'
   ↓
10. User redirected back to account
    ↓
11. Features immediately re-enabled
```

### Paid User Subscription Renewal
```
1. Billing cycle ends (monthly or annual)
   ↓
2. Stripe automatically charges card
   ↓
3. If successful:
   - Webhook: customer.subscription.updated
   - Database: current_period_end updated
   - User continues with access
   ↓
4. If payment fails:
   - Webhook: invoice.payment_failed
   - Database: status → 'past_due'
   - Stripe retries payment
   - User notified via email
   - Access continues during retry period
```

## Cancellation Policy

### User Cancels Subscription
1. User goes to Account page
2. Clicks "Manage Billing" → Stripe Customer Portal
3. Clicks "Cancel Subscription"
4. Webhook: `customer.subscription.deleted`
5. Database: `status='canceled'`
6. User retains access until `current_period_end`
7. After period ends, features blocked
8. User can resubscribe anytime

### Refund Policy (Recommended)
- Full refund if canceled within 7 days of first payment
- No refunds after 7 days (prorated access given)
- Trial periods don't count toward refund window
- Contact support@doclens.net for refund requests

## Pricing Rationale

### Why $5/month?
- **Affordable for individual teachers:** Most teachers pay out-of-pocket
- **Lower than competitors:** Draftback charges more
- **Sustainable:** Covers hosting and support costs
- **School-friendly:** Easy to reimburse

### Why $40/year (33% discount)?
- **Encourages annual commitment:** More predictable revenue
- **Reduces churn:** Yearly subscribers less likely to cancel
- **Aligns with school year:** Teachers think in academic years
- **Better value perception:** Clear savings displayed

### Why Two Signup Options?
- **Reduces friction for cautious users:** Free trial with no CC removes barrier
- **Captures ready buyers:** Paid signup for those ready to commit
- **Higher conversion overall:** Data shows offering both increases signups
- **Flexibility:** Different teachers have different preferences

## Competitive Analysis

| Product | Price | Trial | Notes |
|---------|-------|-------|-------|
| **DocLens** | $5/mo or $40/yr | 14 days, no CC | Lower price, flexible trial |
| Draftback | ~$10/mo | Limited features | Higher price |
| Turnitin | Enterprise only | - | Schools only, expensive |
| Grammarly Edu | $30/student/yr | 7 days | Student-focused, different use case |

## Revenue Projections

### Conservative (Year 1)
- 100 paying subscribers × $5/mo = $500/mo = $6,000/yr
- 50 annual subscribers × $40/yr = $2,000/yr
- **Total:** ~$8,000/yr

### Moderate (Year 1)
- 500 paying monthly × $5 = $2,500/mo = $30,000/yr
- 200 annual × $40 = $8,000/yr
- **Total:** ~$38,000/yr

### Optimistic (Year 1)
- 1,000 paying monthly × $5 = $5,000/mo = $60,000/yr
- 500 annual × $40 = $20,000/yr
- 5 school licenses × $500/yr = $2,500/yr
- **Total:** ~$82,500/yr

### Assumptions
- 10% trial-to-paid conversion rate
- 5% monthly churn
- 70% retention for annual plans
- Need 10,000+ extension installs for moderate projections

## Key Metrics to Track

### Acquisition
- Extension installs (Chrome Web Store)
- Website visitors
- Signup button clicks
- Trial signups started

### Conversion
- Free trial → Paid (target: 10%)
- Immediate paid signups
- Monthly vs. Annual split

### Retention
- Monthly churn rate (target: <5%)
- Annual renewal rate (target: >70%)
- Reactivation rate (canceled → resubscribed)

### Revenue
- Monthly Recurring Revenue (MRR)
- Annual Run Rate (ARR)
- Average Revenue Per User (ARPU)
- Customer Lifetime Value (LTV)

## Future Pricing Considerations

### Potential Changes
- Add mid-tier plan ($8/mo with extra features)
- Family/department plan (5 teachers for $20/mo)
- Lifetime license ($200 one-time)
- School year plan (9 months for $35)

### Features to Add (Premium Tier)
- Advanced analytics dashboard
- Export to multiple formats (PDF, CSV)
- Integration with LMS systems
- Priority support
- Team collaboration features

### Not Recommended
- Freemium model (too many support costs)
- Per-document pricing (friction, hard to predict)
- Feature-gated tiers (confusing, limits adoption)
- Dynamic pricing (seems unfair)
