import Stripe from "stripe";

// Allow build to succeed even if Stripe keys aren't configured yet
// The actual routes will validate the key when used
const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_for_build";

export const stripe = new Stripe(stripeKey, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

// Helper to check if Stripe is properly configured
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== "sk_test_placeholder_for_build";
}

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  starter: {
    name: "Starter",
    price: 9900, // $99.00 in cents
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    maxUsers: 5,
    maxStorageGB: 10,
    features: [
      "5 users",
      "10GB storage",
      "Basic reporting",
      "Email support",
    ],
  },
  professional: {
    name: "Professional",
    price: 29900, // $299.00 in cents
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID!,
    maxUsers: 25,
    maxStorageGB: 50,
    features: [
      "25 users",
      "50GB storage",
      "Advanced reporting",
      "SmartOffice Intelligence",
      "Priority email support",
      "Phone support",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: 99900, // $999.00 in cents
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
    maxUsers: 9999,
    maxStorageGB: 500,
    features: [
      "Unlimited users",
      "500GB storage",
      "Enterprise reporting",
      "White label branding",
      "SmartOffice Intelligence",
      "24/7 priority support",
      "Dedicated account manager",
      "Custom integrations",
    ],
  },
} as const;

export type PlanType = keyof typeof SUBSCRIPTION_PLANS;

/**
 * Create a Stripe Checkout Session for a new tenant signup
 */
export async function createCheckoutSession({
  plan,
  tenantEmail,
  tenantName,
  tenantSlug,
  successUrl,
  cancelUrl,
}: {
  plan: PlanType;
  tenantEmail: string;
  tenantName: string;
  tenantSlug: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const planDetails = SUBSCRIPTION_PLANS[plan];

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: planDetails.priceId,
        quantity: 1,
      },
    ],
    customer_email: tenantEmail,
    metadata: {
      tenantName,
      tenantSlug,
      tenantEmail,
      plan,
    },
    subscription_data: {
      metadata: {
        tenantName,
        tenantSlug,
        plan,
      },
      trial_period_days: 14, // 14-day free trial
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

/**
 * Create a Stripe Customer Portal session for managing subscription
 */
export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Get subscription details from Stripe
 */
export async function getSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
  return subscription;
}

/**
 * Reactivate a subscription that was set to cancel
 */
export async function reactivateSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
  return subscription;
}
