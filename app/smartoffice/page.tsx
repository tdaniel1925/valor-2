import { Suspense } from 'react';
import DashboardContent from '@/components/smartoffice/DashboardContent';
import { prisma } from '@/lib/db/prisma';
import { headers } from 'next/headers';
import { createClient } from '@/lib/auth/supabase-server';

export default async function SmartOfficeDashboardPage() {
  // Get tenant ID from middleware header first
  const headersList = await headers();
  let tenantId = headersList.get('x-tenant-id');

  // If no tenant from middleware, look it up from the logged-in user
  if (!tenantId) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { tenantId: true }
      });

      if (dbUser?.tenantId) {
        tenantId = dbUser.tenantId;
      }
    }
  }

  if (!tenantId) {
    throw new Error('Tenant not found. Please contact support.');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { inboundEmailAddress: true, slug: true }
  });

  // Use a default email if not configured (for testing/development)
  const inboundEmail = tenant?.inboundEmailAddress || `${tenant?.slug || 'inbox'}@valortest.com`;

  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <DashboardContent inboundEmailAddress={inboundEmail} />
    </Suspense>
  );
}

function DashboardLoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-6 md:mb-8">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
