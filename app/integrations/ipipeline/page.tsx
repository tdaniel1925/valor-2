'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { IPipelineLauncher } from '@/components/integrations/IPipelineLauncher';
import { IPIPELINE_PRODUCTS_INFO, IPipelineProduct } from '@/lib/integrations/ipipeline/types';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  ExternalLink,
  FileText,
  Calculator,
  Shield,
  FileCheck,
  Info,
  Loader2,
} from 'lucide-react';

const productIcons: Record<IPipelineProduct, React.ReactNode> = {
  igo: <FileText className="h-5 w-5 text-blue-600" />,
  lifepipe: <Calculator className="h-5 w-5 text-green-600" />,
  formspipe: <FileCheck className="h-5 w-5 text-purple-600" />,
  productinfo: <Info className="h-5 w-5 text-gray-600" />,
  xrae: <Shield className="h-5 w-5 text-red-600" />,
};

export default function IPipelineIntegrationPage() {
  const { user, loading, error } = useCurrentUser();

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="max-w-5xl mx-auto flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !user) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="max-w-5xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <p className="text-red-600 dark:text-red-400">
                {error || 'Failed to load user data. Please refresh the page.'}
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            iPipeline Integration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Access iPipeline&apos;s suite of insurance technology tools with single sign-on
          </p>
        </div>

        {/* Products Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Available Products</CardTitle>
            <CardDescription>
              Click any product below to launch with automatic authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.entries(IPIPELINE_PRODUCTS_INFO) as [IPipelineProduct, typeof IPIPELINE_PRODUCTS_INFO[IPipelineProduct]][])
                .map(([key, info]) => (
                <div
                  key={key}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
                >
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                    {productIcons[key]}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{info.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {info.description}
                    </p>
                    <IPipelineLauncher
                      user={user}
                      defaultProduct={key}
                      variant="default"
                      size="sm"
                      buttonText={`Open ${info.name}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <a
              href="https://www.ipipeline.com/support"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              iPipeline Support
            </a>
            <a
              href="mailto:support@ipipeline.com"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Contact Support
            </a>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
