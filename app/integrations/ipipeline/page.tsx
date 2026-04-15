'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { IPipelineLauncher } from '@/components/integrations/IPipelineLauncher';
import { IPIPELINE_PRODUCTS_INFO, IPipelineProduct } from '@/lib/integrations/ipipeline/types';
import {
  ExternalLink,
  FileText,
  Calculator,
  Shield,
  FileCheck,
  Info,
} from 'lucide-react';

// Demo user - in production this would come from auth context
const currentUser = {
  id: 'demo-user-001',
  firstName: 'Sarah',
  lastName: 'Johnson',
  email: 'sarah.johnson@valorfinancial.com',
  phone: '(555) 123-4567',
  address1: '123 Main St',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
};

const productIcons: Record<IPipelineProduct, React.ReactNode> = {
  igo: <FileText className="h-5 w-5 text-blue-600" />,
  lifepipe: <Calculator className="h-5 w-5 text-green-600" />,
  formspipe: <FileCheck className="h-5 w-5 text-purple-600" />,
  productinfo: <Info className="h-5 w-5 text-gray-600" />,
  xrae: <Shield className="h-5 w-5 text-red-600" />,
};

export default function IPipelineIntegrationPage() {

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
                .filter(([key]) => key === 'lifepipe')
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
                      user={currentUser}
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
