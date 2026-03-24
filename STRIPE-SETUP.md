# Stripe Integration Setup Guide

This guide walks you through setting up Stripe for the Valor multi-tenant SaaS platform.

## Prerequisites

- A Stripe account (sign up at https://stripe.com)
- Access to your Supabase project dashboard
- Admin access to your database

## Step 1: Database Schema Migration

Due to permission constraints with automatic migrations, you'll need to manually run the SQL migration:

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `prisma/migrations/manual_add_stripe_fields.sql`
4. Paste and execute the SQL script
5. Verify the columns were added to the `tenants` table

After running the migration, regenerate your Prisma client:

```bash
npx prisma generate
```

## Step 2: Create Stripe Products and Prices

### Test Mode Setup (Recommended First)

1. Log into your Stripe Dashboard (https://dashboard.stripe.com)
2. Ensure you're in **Test Mode** (toggle in top right)

### Create Products

Navigate to **Products** → **Add Product** and create three products:

#### Starter Plan
- **Name**: Valor Starter
- **Description**: Perfect for small agencies
- **Pricing**:
  - Price: $99.00 USD
  - Billing Period: Monthly
  - ✅ Recurring
- **Save** and copy the **Price ID** (starts with `price_`)

#### Professional Plan
- **Name**: Valor Professional
- **Description**: For growing agencies
- **Pricing**:
  - Price: $299.00 USD
  - Billing Period: Monthly
  - ✅ Recurring
- **Save** and copy the **Price ID**

#### Enterprise Plan
- **Name**: Valor Enterprise
- **Description**: For large enterprises
- **Pricing**:
  - Price: $999.00 USD
  - Billing Period: Monthly
  - ✅ Recurring
- **Save** and copy the **Price ID**

## Step 3: Environment Variables

Add these variables to your `.env.local` file:

```bash
# Stripe API Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Price IDs (from Step 2)
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PROFESSIONAL_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...

# Stripe Webhook Secret (from Step 4)
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Configure Webhooks

### Local Development (Stripe CLI)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli#install
2. Login to Stripe CLI:
   ```bash
   stripe login
   ```
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Copy the webhook signing secret (starts with `whsec_`) to `STRIPE_WEBHOOK_SECRET`

### Production Deployment

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Set endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the **Signing secret** to your production environment variables

## Step 5: Test the Integration

### Test Signup Flow

1. Start your development server:
   ```bash
   npm run dev
   ```
2. Navigate to `http://localhost:3000/signup/tenant`
3. Fill out the signup form and select a plan
4. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

### Test Webhooks

1. Complete a test signup
2. Check your Stripe CLI output - you should see webhook events
3. Verify in your database that the tenant was created with correct Stripe IDs
4. Check Supabase Auth - the owner user should be created

### Test Billing Portal

1. Log in as a tenant owner
2. Navigate to Settings → Billing
3. Click "Manage Subscription"
4. Verify you're redirected to Stripe Customer Portal
5. Test updating payment method, viewing invoices

## Step 6: Production Checklist

Before going live with real payments:

- [ ] Switch to Stripe **Live Mode**
- [ ] Create live products and prices (same as test mode)
- [ ] Update environment variables with live keys
- [ ] Configure production webhook endpoint
- [ ] Test with real card (then refund)
- [ ] Enable Stripe Radar for fraud protection
- [ ] Set up email receipts in Stripe settings
- [ ] Review Stripe's tax settings if applicable

## Subscription Plans

The platform offers three subscription tiers:

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| **Price** | $99/mo | $299/mo | $999/mo |
| **Users** | 5 | 25 | Unlimited |
| **Storage** | 10GB | 50GB | 500GB |
| **Trial** | 14 days | 14 days | 14 days |
| **SmartOffice Intelligence** | ❌ | ✅ | ✅ |
| **White Label** | ❌ | ❌ | ✅ |
| **Support** | Email | Email + Phone | 24/7 + Dedicated Manager |

## Features Implemented

### Tenant Signup Flow
- Public signup form at `/signup/tenant`
- Plan selection with feature comparison
- Subdomain validation (real-time)
- Form validation with Zod
- Stripe Checkout redirect
- 14-day free trial (no card charged immediately)
- Email verification

### Stripe Webhook Handler
- `checkout.session.completed` - Creates tenant + owner in database
- `customer.subscription.updated` - Updates subscription status
- `customer.subscription.deleted` - Handles cancellations
- `invoice.payment_failed` - Marks tenant as past due

### Billing Portal
- View current plan and usage
- Upgrade/downgrade plans
- Update payment method
- View billing history
- Cancel subscription
- Managed entirely by Stripe Customer Portal

### Security Features
- Webhook signature verification
- Environment variable validation
- Stripe API error handling
- Database transaction safety
- TypeScript strict mode

## Common Issues

### "Webhook signature verification failed"
- Ensure `STRIPE_WEBHOOK_SECRET` is correct
- Check that you're forwarding webhooks with Stripe CLI in development
- Verify production webhook endpoint URL is correct

### "Price ID not found"
- Double-check your price IDs in `.env.local`
- Ensure you're using the correct mode (test vs live)
- Verify products are active in Stripe Dashboard

### "Must be owner of table" error
- This is a Supabase permission issue
- Run the manual SQL migration script as described in Step 1
- Use a database user with sufficient privileges

### Tenant not created after checkout
- Check Stripe CLI logs for webhook errors
- Verify webhook secret is correct
- Check Next.js server logs for errors
- Ensure Supabase credentials are correct

## API Reference

### POST /api/stripe/create-checkout
Creates a Stripe Checkout session for new tenant signup.

**Body:**
```json
{
  "plan": "starter" | "professional" | "enterprise",
  "agencyName": "string",
  "subdomain": "string",
  "ownerEmail": "string",
  "ownerFirstName": "string",
  "ownerLastName": "string",
  "ownerPassword": "string"
}
```

### POST /api/stripe/create-portal-session
Creates a Stripe Customer Portal session for subscription management.

**Body:**
```json
{
  "returnUrl": "string"
}
```

**Headers:**
- Requires authentication (tenant owner only)

### POST /api/webhooks/stripe
Handles Stripe webhook events. Called by Stripe, not your application.

**Headers:**
- `stripe-signature` - Required for verification

## Support

For issues with Stripe integration:
1. Check Stripe Dashboard logs
2. Review webhook event history
3. Check Next.js server logs
4. Review this documentation
5. Contact Stripe support if needed

For Valor platform issues:
- Create an issue in the repository
- Check existing documentation
