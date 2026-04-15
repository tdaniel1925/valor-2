'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { IPipelineLauncher } from '@/components/integrations/IPipelineLauncher';
import { IPIPELINE_PRODUCTS_INFO } from '@/lib/integrations/ipipeline/types';
import {
  ExternalLink,
  Shield,
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
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

export default function XRAEIntegrationPage() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <Shield className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                XRAE Integration
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                ExamOne Risk Assessment & Underwriting Platform
              </p>
            </div>
          </div>
        </div>

        {/* Quick Launch */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Launch XRAE</CardTitle>
            <CardDescription>
              Access ExamOne&apos;s Risk Assessment platform with automatic authentication through iPipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4 p-4 rounded-lg border bg-white dark:bg-gray-800">
              <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">{IPIPELINE_PRODUCTS_INFO.xrae.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {IPIPELINE_PRODUCTS_INFO.xrae.description}
                </p>
                <IPipelineLauncher
                  user={currentUser}
                  defaultProduct="xrae"
                  variant="default"
                  size="lg"
                  buttonText="Open XRAE Platform"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>XRAE Features</CardTitle>
            <CardDescription>
              Comprehensive underwriting and risk assessment tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Risk Assessment</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Comprehensive medical and non-medical risk evaluation
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Real-Time Data</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Instant access to exam results and medical records
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Case Management</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Track and manage underwriting cases efficiently
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Alerts & Notifications</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Automated updates on case status and requirements
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <a
              href="https://www.examone.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              ExamOne Website
            </a>
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
              href="mailto:support@examone.com"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Contact ExamOne Support
            </a>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
