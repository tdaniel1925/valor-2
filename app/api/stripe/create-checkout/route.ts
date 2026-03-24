import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession, PlanType, isStripeConfigured } from "@/lib/stripe/stripe-server";
import { z } from "zod";

const checkoutSchema = z.object({
  agencyName: z.string().min(2),
  ownerEmail: z.string().email(),
  ownerFirstName: z.string().min(1),
  ownerLastName: z.string().min(1),
  ownerPassword: z.string().min(8),
  subdomain: z.string().min(3).max(63),
  plan: z.enum(["starter", "professional", "enterprise"]),
});

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const validatedData = checkoutSchema.parse(body);

    const { plan, ownerEmail, agencyName, subdomain, ownerFirstName, ownerLastName, ownerPassword } = validatedData;

    // Create Stripe Checkout Session
    const session = await createCheckoutSession({
      plan: plan as PlanType,
      tenantEmail: ownerEmail,
      tenantName: agencyName,
      tenantSlug: subdomain,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/signup/tenant`,
    });

    // Store signup data in session metadata for webhook processing
    // The actual tenant + user creation will happen in the webhook handler
    // after successful payment

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
