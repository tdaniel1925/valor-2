import { Suspense } from "react";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe/stripe-server";
import BillingContent from "@/components/billing/BillingContent";

export default async function BillingPage() {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    throw new Error("Tenant not found");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      plan: true,
      status: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      maxUsers: true,
      maxStorageGB: true,
      _count: {
        select: {
          users: true,
        },
      },
    },
  });

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  const planData = SUBSCRIPTION_PLANS[tenant.plan as keyof typeof SUBSCRIPTION_PLANS];

  // Convert readonly arrays to mutable for component compatibility
  const plan = {
    name: planData.name,
    price: planData.price,
    maxUsers: planData.maxUsers,
    maxStorageGB: planData.maxStorageGB,
    features: [...planData.features],
  };

  return (
    <Suspense fallback={<BillingLoadingSkeleton />}>
      <BillingContent tenant={tenant} plan={plan} />
    </Suspense>
  );
}

function BillingLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-48 mb-8 animate-pulse"></div>
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
