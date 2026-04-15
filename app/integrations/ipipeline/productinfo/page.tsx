'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { IPipelineLauncher } from '@/components/integrations/IPipelineLauncher';

export default function ProductInfoLauncherPage() {
  const router = useRouter();

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              iPipeline Product Catalog
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Launching secure SSO session to iPipeline ProductInfo...
            </p>
          </div>

          {/* Auto-launch */}
          <IPipelineLauncher
            user={{
              id: 'auto',
              email: 'auto',
              firstName: 'auto',
              lastName: 'auto',
            }}
            defaultProduct="productinfo"
            variant="default"
            size="lg"
            buttonText="Launch Product Catalog"
          />
        </div>
      </div>
    </AppLayout>
  );
}
