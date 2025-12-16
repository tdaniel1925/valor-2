'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExternalLink, Loader2, AlertCircle, CheckCircle, FileText, Calculator, Shield, Info, FileCheck } from 'lucide-react';
import { IPipelineProduct, IPIPELINE_PRODUCTS_INFO } from '@/lib/integrations/ipipeline/types';

interface IPipelineLauncherProps {
  /** User information for SSO */
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address1?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  /** Default product to launch */
  defaultProduct?: IPipelineProduct;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'default';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Custom button text */
  buttonText?: string;
  /** Show product selector */
  showProductSelector?: boolean;
  /** Additional CSS classes */
  className?: string;
}

type LaunchStatus = 'idle' | 'loading' | 'success' | 'error';

const productIcons: Record<IPipelineProduct, React.ReactNode> = {
  igo: <FileText className="h-4 w-4" />,
  lifepipe: <Calculator className="h-4 w-4" />,
  formspipe: <FileCheck className="h-4 w-4" />,
  xrae: <Shield className="h-4 w-4" />,
  productinfo: <Info className="h-4 w-4" />,
};

/**
 * iPipeline Launcher Component
 *
 * Handles SAML 2.0 SSO authentication with iPipeline products
 * and opens them in a new browser window.
 */
export function IPipelineLauncher({
  user,
  defaultProduct = 'igo',
  variant = 'default',
  size = 'md',
  buttonText,
  showProductSelector = false,
  className = '',
}: IPipelineLauncherProps) {
  const [status, setStatus] = useState<LaunchStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<IPipelineProduct>(defaultProduct);

  const productInfo = IPIPELINE_PRODUCTS_INFO[selectedProduct];
  const displayText = buttonText || `Launch ${productInfo.name}`;

  const handleLaunch = async (product: IPipelineProduct = selectedProduct) => {
    setStatus('loading');
    setError(null);

    try {
      // Get the SAML response from our API
      const response = await fetch('/api/integrations/ipipeline/sso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          address1: user.address1,
          city: user.city,
          state: user.state,
          zipCode: user.zipCode,
          product,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate iPipeline SSO request');
      }

      if (data.samlResponse && data.acsUrl) {
        setStatus('success');

        // Open new window first (to avoid popup blocker)
        const iPipelineWindow = window.open('about:blank', 'iPipeline', 'width=1400,height=900,menubar=no,toolbar=no,location=yes,status=no');

        if (!iPipelineWindow) {
          setError('Popup blocked. Please allow popups for this site and try again.');
          setStatus('error');
          setDialogOpen(true);
          return;
        }

        // Write SAML form to the new window and submit
        iPipelineWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head><title>Connecting to iPipeline...</title></head>
          <body>
            <p style="font-family: sans-serif; text-align: center; margin-top: 50px;">
              Connecting to iPipeline ${productInfo.name}...
            </p>
            <form id="samlForm" method="POST" action="${data.acsUrl}">
              <input type="hidden" name="SAMLResponse" value="${data.samlResponse}" />
              <input type="hidden" name="RelayState" value="${data.relayState}" />
            </form>
            <script>document.getElementById('samlForm').submit();</script>
          </body>
          </html>
        `);
        iPipelineWindow.document.close();

        // Success - close dialog after short delay
        setTimeout(() => {
          setStatus('idle');
          setDialogOpen(false);
        }, 1500);
      } else {
        throw new Error('Failed to generate iPipeline SSO request');
      }
    } catch (err: unknown) {
      console.error('iPipeline launch error:', err);
      const message = err instanceof Error ? err.message : 'Failed to launch iPipeline';
      setError(message);
      setStatus('error');
      setDialogOpen(true);
    }
  };

  if (showProductSelector) {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={`${className} gap-2`}
          >
            <ExternalLink className="h-4 w-4" />
            Launch iPipeline
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Launch iPipeline Product</DialogTitle>
            <DialogDescription>
              Select which iPipeline product you want to open
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <Select value={selectedProduct} onValueChange={(v) => setSelectedProduct(v as IPipelineProduct)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(IPIPELINE_PRODUCTS_INFO) as [IPipelineProduct, typeof IPIPELINE_PRODUCTS_INFO[IPipelineProduct]][]).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {productIcons[key]}
                      <span>{info.name}</span>
                      <span className="text-xs text-gray-500">- {info.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {status === 'error' && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span>iPipeline opened in a new window</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleLaunch(selectedProduct)}
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    {productIcons[selectedProduct]}
                    <span className="ml-2">Launch {IPIPELINE_PRODUCTS_INFO[selectedProduct].name}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Simple button without dialog for direct product launch
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`${className} gap-2`}
          onClick={() => handleLaunch()}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            productIcons[selectedProduct]
          )}
          {status === 'loading' ? 'Connecting...' : displayText}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {status === 'loading' && (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                Connecting to iPipeline...
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                iPipeline Launched
              </>
            )}
            {status === 'error' && (
              <>
                <AlertCircle className="h-5 w-5 text-red-600" />
                Launch Failed
              </>
            )}
          </DialogTitle>
          <DialogDescription asChild>
            <div>
              {status === 'loading' && (
                <span>Please wait while we authenticate your session with iPipeline {productInfo.name}...</span>
              )}
              {status === 'success' && (
                <span>iPipeline {productInfo.name} has been opened in a new window. You can close this dialog.</span>
              )}
              {status === 'error' && (
                <div className="space-y-2">
                  <span className="block text-red-600">{error}</span>
                  <span className="block text-sm text-gray-500">
                    If this problem persists, please contact support.
                  </span>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        {status === 'error' && (
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleLaunch()}>
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Quick launch buttons for specific iPipeline products
 */
export function IPipelineQuickLaunch({
  user,
  products = ['igo', 'lifepipe', 'xrae'],
  className = '',
}: {
  user: IPipelineLauncherProps['user'];
  products?: IPipelineProduct[];
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {products.map((product) => (
        <IPipelineLauncher
          key={product}
          user={user}
          defaultProduct={product}
          variant="outline"
          size="sm"
        />
      ))}
    </div>
  );
}

export default IPipelineLauncher;
