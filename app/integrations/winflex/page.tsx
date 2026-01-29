'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WinFlexLauncher } from '@/components/integrations/WinFlexLauncher';
import {
  ExternalLink,
  CheckCircle,
  XCircle,
  Info,
  FileText,
  Users,
  Building,
  Shield,
} from 'lucide-react';

// Demo user - in production this would come from auth context
const currentUser = {
  id: 'demo-user-001',
  firstName: 'Sarah',
  lastName: 'Johnson',
  email: 'sarah.johnson@valorfinancial.com',
  companyName: 'Valor Financial Specialists',
  phone: '(555) 123-4567',
};

interface WinFlexStatus {
  enabled: boolean;
  configured: boolean;
  companyCode: string | null;
}

export default function WinFlexIntegrationPage() {
  const [status, setStatus] = useState<WinFlexStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/integrations/winflex/sso')
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => {
        setStatus({ enabled: false, configured: false, companyCode: null });
        setLoading(false);
      });
  }, []);

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                WinFlex Integration
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Professional life insurance illustration software by Zinnia
              </p>
            </div>
            {status && (
              <Badge
                className={
                  status.enabled && status.configured
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'
                }
              >
                {status.enabled && status.configured ? (
                  <>
                    <Info className="h-3 w-3 mr-1" />
                    Credentials Set
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Configured
                  </>
                )}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Launch Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200 dark:border-blue-700">
              <CardHeader>
                <CardTitle className="text-xl">Launch WinFlex Web</CardTitle>
                <CardDescription>
                  Create professional life insurance illustrations with real-time carrier quotes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <WinFlexLauncher
                    user={currentUser}
                    buttonText="Open WinFlex Web"
                    variant="default"
                    size="lg"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Opens in a new browser tab
                  </span>
                </div>

                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    About WinFlex SSO
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Requires valid agency credentials from Zinnia</li>
                    <li>• Contact Zinnia to register your agency for SSO access</li>
                    <li>• Once configured, users are auto-authenticated</li>
                    <li>• First-time users are auto-registered in WinFlex</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Features Card */}
            <Card>
              <CardHeader>
                <CardTitle>WinFlex Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm">Multi-Carrier Quotes</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Compare quotes from 100+ insurance carriers
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm">Product Types</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Term, Whole, Universal, Variable, and more
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm">Client Presentations</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Professional PDFs for client meetings
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Building className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm">Agency Branding</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Customize illustrations with your agency logo
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Connection Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Connection Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Status</span>
                  <span className="font-medium">
                    {loading ? (
                      'Checking...'
                    ) : status?.enabled && status?.configured ? (
                      <span className="text-blue-600">Credentials Set</span>
                    ) : (
                      <span className="text-yellow-600">Not Configured</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Company Code</span>
                  <span className="font-mono font-medium">
                    {status?.companyCode || '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Login Type</span>
                  <span className="font-medium">WF_AGENCY</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Provider</span>
                  <span className="font-medium">Zinnia (LifeLink)</span>
                </div>
                {status?.enabled && status?.configured && (
                  <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-700 dark:text-yellow-400">
                    <strong>Note:</strong> SSO requires valid credentials from Zinnia. Contact them to register your agency.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Logged In As */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Logged In As</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold">
                  {currentUser.firstName} {currentUser.lastName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentUser.email}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentUser.companyName}
                </p>
              </CardContent>
            </Card>

            {/* Help Links */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a
                  href="https://www.winflexweb.com/help"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full justify-start text-sm h-9 inline-flex items-center rounded-md px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  WinFlex Help Center
                </a>
                <a
                  href="mailto:support.winflex@zinnia.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full justify-start text-sm h-9 inline-flex items-center rounded-md px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Contact WinFlex Support
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
