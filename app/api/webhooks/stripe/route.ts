import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe, SUBSCRIPTION_PLANS } from "@/lib/stripe/stripe-server";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/auth/supabase-server";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout - create tenant and owner user
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { tenantName, tenantSlug, tenantEmail, plan } = session.metadata as {
    tenantName: string;
    tenantSlug: string;
    tenantEmail: string;
    plan: keyof typeof SUBSCRIPTION_PLANS;
  };

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  const planDetails = SUBSCRIPTION_PLANS[plan];

  // Generate random inbound email address
  const inboundEmailAddress = generateRandomString(8);

  // Create tenant in database
  const tenant = await prisma.tenant.create({
    data: {
      name: tenantName,
      slug: tenantSlug,
      emailSlug: tenantSlug,
      emailVerified: false,
      inboundEmailAddress,
      inboundEmailEnabled: true,
      plan,
      status: "ACTIVE",
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      subscriptionStatus: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      maxUsers: planDetails.maxUsers,
      maxStorageGB: planDetails.maxStorageGB,
    },
  });

  // Create owner user in Supabase Auth and database
  const supabase = await createClient();

  // Note: In production, you'd get the password from a secure location
  // For now, we'll send a password reset email instead
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: tenantEmail,
    email_confirm: true,
    user_metadata: {
      tenantId: tenant.id,
      role: "ADMINISTRATOR",
    },
  });

  if (authError) {
    console.error("Failed to create Supabase user:", authError);
    // Clean up tenant if user creation fails
    await prisma.tenant.delete({ where: { id: tenant.id } });
    throw new Error("Failed to create user account");
  }

  // Create user record in database
  const ownerNames = tenantName.split(" ");
  const firstName = ownerNames[0] || "Owner";
  const lastName = ownerNames.slice(1).join(" ") || "";

  await prisma.user.create({
    data: {
      id: authData.user.id,
      tenantId: tenant.id,
      email: tenantEmail,
      firstName,
      lastName,
      role: "ADMINISTRATOR",
      status: "ACTIVE",
      emailVerified: true,
    },
  });

  console.log(`✅ Tenant created: ${tenantSlug} (${tenant.id})`);
  console.log(`✅ Owner user created: ${tenantEmail}`);

  // TODO: Send welcome email with setup instructions
}

/**
 * Handle subscription updates (plan changes, renewals, etc.)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const tenant = await prisma.tenant.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!tenant) {
    console.error(`Tenant not found for subscription: ${subscription.id}`);
    return;
  }

  // Determine new plan from price ID
  let newPlan = tenant.plan;
  let maxUsers = tenant.maxUsers;
  let maxStorageGB = tenant.maxStorageGB;

  for (const [planKey, planDetails] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (planDetails.priceId === subscription.items.data[0].price.id) {
      newPlan = planKey;
      maxUsers = planDetails.maxUsers;
      maxStorageGB = planDetails.maxStorageGB;
      break;
    }
  }

  // Update tenant
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      plan: newPlan,
      subscriptionStatus: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      maxUsers,
      maxStorageGB,
      status: subscription.status === "active" ? "ACTIVE" : "SUSPENDED",
    },
  });

  console.log(`✅ Subscription updated: ${tenant.slug} - ${subscription.status}`);
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const tenant = await prisma.tenant.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!tenant) {
    console.error(`Tenant not found for subscription: ${subscription.id}`);
    return;
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      status: "CHURNED",
      subscriptionStatus: "canceled",
    },
  });

  console.log(`✅ Subscription canceled: ${tenant.slug}`);

  // TODO: Send cancellation email
}

/**
 * Handle failed payments
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const tenant = await prisma.tenant.findUnique({
    where: { stripeSubscriptionId: invoice.subscription as string },
  });

  if (!tenant) {
    console.error(`Tenant not found for subscription: ${invoice.subscription}`);
    return;
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      status: "SUSPENDED",
      subscriptionStatus: "past_due",
    },
  });

  console.log(`⚠️ Payment failed: ${tenant.slug}`);

  // TODO: Send payment failed email
}

/**
 * Generate random alphanumeric string
 */
function generateRandomString(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
