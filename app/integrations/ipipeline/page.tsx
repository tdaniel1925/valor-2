'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IPipelineLauncher } from '@/components/integrations/IPipelineLauncher';
import { IPIPELINE_PRODUCTS_INFO, IPipelineProduct } from '@/lib/integrations/ipipeline/types';
import {
  ExternalLink,
  Info,
  XCircle,
  FileText,
  Calculator,
  Shield,
  FileCheck,
  Download,
  Key,
  AlertTriangle,
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

interface IPipelineStatus {
  enabled: boolean;
  configured: boolean;
  environment: string;
  gaid: string;
  channelName: string;
  entityId: string | null;
  products: string[];
}

const productIcons: Record<IPipelineProduct, React.ReactNode> = {
  igo: <FileText className="h-5 w-5 text-blue-600" />,
  lifepipe: <Calculator className="h-5 w-5 text-green-600" />,
  formspipe: <FileCheck className="h-5 w-5 text-purple-600" />,
  xrae: <Shield className="h-5 w-5 text-orange-600" />,
  productinfo: <Info className="h-5 w-5 text-gray-600" />,
};

export default function IPipelineIntegrationPage() {
  const [status, setStatus] = useState<IPipelineStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/integrations/ipipeline')
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => {
        setStatus({
          enabled: false,
          configured: false,
          environment: 'uat',
          gaid: '2717',
          channelName: 'VAL',
          entityId: null,
          products: [],
        });
        setLoading(false);
      });
  }, []);

  const handleDownloadMetadata = async () => {
    try {
      const response = await fetch('/api/integrations/ipipeline/metadata');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'valor-idp-metadata.xml';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to download metadata');
      }
    } catch (error) {
      alert('Failed to download metadata file');
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  iPipeline Integration
                </h1>
                <span className="px-4 py-2 bg-red-600 text-white text-lg font-bold rounded-lg shadow-lg">
                  COMING SOON
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Life insurance quoting, e-applications, and risk assessment
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
                    Configured
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Setup Required
                  </>
                )}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Setup Required Banner */}
            {status && (!status.enabled || !status.configured) && (
              <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                        SAML SSO Setup Required
                      </h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        To enable iPipeline SSO, you need to:
                      </p>
                      <ol className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 list-decimal list-inside space-y-1">
                        <li>Generate SSL certificate for SAML signing</li>
                        <li>Download the IdP metadata file below</li>
                        <li>Send metadata file to iPipeline (2 weeks before testing)</li>
                        <li>Configure environment variables with certificate</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Products Grid */}
            <Card>
              <CardHeader>
                <CardTitle>iPipeline Products</CardTitle>
                <CardDescription>
                  Access iPipeline&apos;s suite of insurance technology tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(Object.entries(IPIPELINE_PRODUCTS_INFO) as [IPipelineProduct, typeof IPIPELINE_PRODUCTS_INFO[IPipelineProduct]][]).map(([key, info]) => (
                    <div
                      key={key}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
                    >
                      <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                        {productIcons[key]}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{info.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {info.description}
                        </p>
                        <div className="mt-2">
                          <IPipelineLauncher
                            user={currentUser}
                            defaultProduct={key}
                            variant="outline"
                            size="sm"
                            buttonText={`Open ${info.name}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Launch */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200 dark:border-blue-700">
              <CardHeader>
                <CardTitle className="text-xl">Quick Launch</CardTitle>
                <CardDescription>
                  Launch any iPipeline product with SAML SSO authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <IPipelineLauncher
                    user={currentUser}
                    showProductSelector
                    variant="default"
                    size="lg"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Opens in a new window
                  </span>
                </div>

                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    About iPipeline SAML SSO
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Uses SAML 2.0 HTTP POST binding</li>
                    <li>• Requires IdP metadata exchange with iPipeline</li>
                    <li>• Automatic user provisioning on first login</li>
                    <li>• Secure signed assertions with X.509 certificate</li>
                  </ul>
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
                      <span className="text-blue-600">Configured</span>
                    ) : (
                      <span className="text-yellow-600">Setup Required</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Environment</span>
                  <Badge variant="outline" className="font-mono">
                    {status?.environment?.toUpperCase() || 'UAT'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">GAID</span>
                  <span className="font-mono font-medium">{status?.gaid || '2717'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Channel</span>
                  <span className="font-mono font-medium">{status?.channelName || 'VAL'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Protocol</span>
                  <span className="font-medium">SAML 2.0</span>
                </div>
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
              </CardContent>
            </Card>

            {/* Setup Tools */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Setup Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleDownloadMetadata}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download IdP Metadata
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Send this XML file to iPipeline to register Valor as an Identity Provider.
                </p>
              </CardContent>
            </Card>

            {/* Resources */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a
                  href="https://www.ipipeline.com/support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full justify-start text-sm h-9 inline-flex items-center rounded-md px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  iPipeline Support
                </a>
                <a
                  href="mailto:support@ipipeline.com"
                  className="w-full justify-start text-sm h-9 inline-flex items-center rounded-md px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Contact Support
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
