'use client';

import AppLayout from '@/components/layout/AppLayout';
import { IPipelineLauncher } from '@/components/integrations/IPipelineLauncher';
import { IPIPELINE_PRODUCTS_INFO, IPipelineProduct } from '@/lib/integrations/ipipeline/types';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  FileText,
  Calculator,
  Shield,
  FileCheck,
  Info,
  Loader2,
} from 'lucide-react';

const productConfig: Record<IPipelineProduct, { icon: React.ReactNode; color: string; gradient: string }> = {
  igo: {
    icon: <FileText className="h-6 w-6" />,
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    gradient: 'from-blue-500 to-blue-600',
  },
  lifepipe: {
    icon: <Calculator className="h-6 w-6" />,
    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  formspipe: {
    icon: <FileCheck className="h-6 w-6" />,
    color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    gradient: 'from-violet-500 to-violet-600',
  },
  productinfo: {
    icon: <Info className="h-6 w-6" />,
    color: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    gradient: 'from-gray-500 to-gray-600',
  },
  xrae: {
    icon: <Shield className="h-6 w-6" />,
    color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    gradient: 'from-rose-500 to-rose-600',
  },
};

export default function IPipelineIntegrationPage() {
  const { user, loading, error } = useCurrentUser();

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AppLayout>
    );
  }

  if (error || !user) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 max-w-3xl">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <p className="text-red-600 dark:text-red-400">
              {error || 'Failed to load user data. Please refresh the page.'}
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 p-8 md:p-12 mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="px-3 py-1 bg-white/15 rounded-full text-white/80 text-xs font-medium tracking-wide uppercase">
                iPipeline Suite
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              iPipeline Tools
            </h1>
            <p className="text-gray-300 text-lg max-w-xl">
              Access iPipeline&apos;s full suite of insurance technology tools with single sign-on.
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.entries(IPIPELINE_PRODUCTS_INFO) as [IPipelineProduct, typeof IPIPELINE_PRODUCTS_INFO[IPipelineProduct]][])
            .map(([key, info]) => {
              const config = productConfig[key];
              return (
                <div
                  key={key}
                  className="group rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all bg-white dark:bg-gray-800"
                >
                  <div className="flex items-start gap-4">
                    <div className={`inline-flex p-3 rounded-xl ${config.color}`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {info.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                        {info.description}
                      </p>
                      <IPipelineLauncher
                        user={user}
                        defaultProduct={key}
                        variant="default"
                        size="sm"
                        buttonText={`Launch ${info.name}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </AppLayout>
  );
}
