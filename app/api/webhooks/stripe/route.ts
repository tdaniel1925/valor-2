import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe, SUBSCRIPTION_PLANS } from "@/lib/stripe/stripe-server";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/auth/supabase-server";
import {
  sendWelcomeEmail,
  sendCancellationEmail,
  sendPaymentFailedEmail,
} from "@/lib/email/resend-client";
import { createLogger } from "@/lib/logging/logger";
import { getRequestId } from "@/lib/logging/request-id";

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const logger = createLogger({
    requestId,
    method: request.method,
    path: '/api/webhooks/stripe',
  });

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    logger.warn('Stripe webhook called without signature header');
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
  } catch (err: any) {
    logger.error('Webhook signature verification failed', {
      error: err.message,
    });
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  logger.info('Stripe webhook received', { eventType: event.type, eventId: event.id });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session, logger);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription, logger);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, logger);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice, logger);
        break;
      }

      default:
        logger.info('Unhandled Stripe event type', { eventType: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.error('Error processing webhook', {
      error: error.message,
      stack: error.stack,
      eventType: event.type,
    });
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout - create tenant and owner user
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, logger: any) {
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
    logger.error('Failed to create Supabase user during checkout', {
      email: tenantEmail,
      error: authError.message,
    });
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

  logger.info('Tenant and owner user created from Stripe checkout', {
    tenantSlug,
    tenantId: tenant.id,
    email: tenantEmail,
    plan,
  });

  // Send welcome email with setup instructions
  try {
    const loginUrl = `https://${tenantSlug}.valorfs.app/login`;
    await sendWelcomeEmail({
      tenantName,
      tenantSlug,
      email: tenantEmail,
      loginUrl,
    });
  } catch (emailError: any) {
    // Log but don't fail the webhook if email fails
    logger.error('Failed to send welcome email', { error: emailError.message });
  }
}

/**
 * Handle subscription updates (plan changes, renewals, etc.)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription, logger: any) {
  const tenant = await prisma.tenant.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!tenant) {
    logger.error('Tenant not found for subscription update', {
      subscriptionId: subscription.id,
    });
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

  logger.info('Subscription updated', {
    tenantSlug: tenant.slug,
    subscriptionStatus: subscription.status,
    plan: newPlan,
  });
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription, logger: any) {
  const tenant = await prisma.tenant.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!tenant) {
    logger.error('Tenant not found for subscription deletion', {
      subscriptionId: subscription.id,
    });
    return;
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      status: "CHURNED",
      subscriptionStatus: "canceled",
    },
  });

  logger.warn('Subscription canceled', { tenantSlug: tenant.slug });

  // Send cancellation email
  try {
    // Get owner user email
    const owner = await prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        role: 'ADMINISTRATOR',
      },
      orderBy: { createdAt: 'asc' },
    });

    if (owner) {
      const effectiveDate = new Date(subscription.current_period_end * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      await sendCancellationEmail({
        tenantName: tenant.name,
        email: owner.email,
        effectiveDate,
      });
    }
  } catch (emailError: any) {
    // Log but don't fail the webhook if email fails
    logger.error('Failed to send cancellation email', { error: emailError.message });
  }
}

/**
 * Handle failed payments
 */
async function handlePaymentFailed(invoice: Stripe.Invoice, logger: any) {
  if (!invoice.subscription) return;

  const tenant = await prisma.tenant.findUnique({
    where: { stripeSubscriptionId: invoice.subscription as string },
  });

  if (!tenant) {
    logger.error('Tenant not found for failed payment', {
      subscriptionId: invoice.subscription,
    });
    return;
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      status: "SUSPENDED",
      subscriptionStatus: "past_due",
    },
  });

  logger.warn('Payment failed - tenant suspended', {
    tenantSlug: tenant.slug,
    amountDue: invoice.amount_due,
  });

  // Send payment failed email
  try {
    // Get owner user email
    const owner = await prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        role: 'ADMINISTRATOR',
      },
      orderBy: { createdAt: 'asc' },
    });

    if (owner && invoice.amount_due) {
      // Calculate next retry attempt (typically 3-7 days)
      const nextAttemptDate = new Date();
      nextAttemptDate.setDate(nextAttemptDate.getDate() + 3);
      const nextAttempt = nextAttemptDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Update payment URL - would typically be Stripe customer portal
      const updatePaymentUrl = `https://${tenant.slug}.valorfs.app/settings/billing`;

      await sendPaymentFailedEmail({
        tenantName: tenant.name,
        email: owner.email,
        amount: invoice.amount_due,
        nextAttempt,
        updatePaymentUrl,
      });
    }
  } catch (emailError: any) {
    // Log but don't fail the webhook if email fails
    logger.error('Failed to send payment failed email', { error: emailError.message });
  }
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
