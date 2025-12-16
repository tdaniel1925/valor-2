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
import { ExternalLink, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface WinFlexLauncherProps {
  /** User information for SSO */
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    companyName?: string;
    phone?: string;
  };
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'default';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Custom button text */
  buttonText?: string;
  /** Show as icon only */
  iconOnly?: boolean;
  /** Additional CSS classes */
  className?: string;
}

type LaunchStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * WinFlex Launcher Component
 *
 * Handles SSO authentication with WinFlex Web and opens
 * the illustration software in a new browser window.
 *
 * Per WinFlex requirements:
 * - Must open in a new browser window (not iframe/frames)
 * - Uses the official WinFlex button design
 */
export function WinFlexLauncher({
  user,
  variant = 'default',
  size = 'md',
  buttonText = 'Launch WinFlex',
  iconOnly = false,
  className = '',
}: WinFlexLauncherProps) {
  const [status, setStatus] = useState<LaunchStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleLaunch = async () => {
    setStatus('loading');
    setError(null);

    try {
      // Get the SSO XML from our API
      const response = await fetch('/api/integrations/winflex/sso/xml', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          companyName: user.companyName || 'Valor Financial Specialists',
          phone: user.phone,
          autoCreate: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate WinFlex SSO request');
      }

      if (data.xml && data.ssoUrl) {
        setStatus('success');

        // Open new window first (to avoid popup blocker)
        const winFlexWindow = window.open('about:blank', 'WinFlexWeb', 'width=1200,height=800,menubar=no,toolbar=no,location=yes,status=no');

        if (!winFlexWindow) {
          setError('Popup blocked. Please allow popups for this site and try again.');
          setStatus('error');
          setDialogOpen(true);
          return;
        }

        // Write form directly to the new window and submit
        winFlexWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head><title>Connecting to WinFlex...</title></head>
          <body>
            <p style="font-family: sans-serif; text-align: center; margin-top: 50px;">
              Connecting to WinFlex Web...
            </p>
            <form id="ssoForm" method="POST" action="${data.ssoUrl}">
              <input type="hidden" name="llXML" value="${data.xml.replace(/"/g, '&quot;')}" />
            </form>
            <script>document.getElementById('ssoForm').submit();</script>
          </body>
          </html>
        `);
        winFlexWindow.document.close();

        // Success - close dialog after short delay
        setTimeout(() => {
          setStatus('idle');
          setDialogOpen(false);
        }, 1500);
      } else {
        throw new Error('Failed to generate WinFlex SSO request');
      }
    } catch (err: any) {
      console.error('WinFlex launch error:', err);
      setError(err.message || 'Failed to launch WinFlex');
      setStatus('error');
      setDialogOpen(true);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`${className} gap-2`}
          onClick={handleLaunch}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
          {!iconOnly && (status === 'loading' ? 'Connecting...' : buttonText)}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {status === 'loading' && (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                Connecting to WinFlex...
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                WinFlex Launched
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
                <span>Please wait while we authenticate your session with WinFlex Web...</span>
              )}
              {status === 'success' && (
                <span>WinFlex Web has been opened in a new window. You can close this dialog.</span>
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
            <Button onClick={handleLaunch}>
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * WinFlex Status Badge
 *
 * Shows if WinFlex integration is enabled/configured
 */
export function WinFlexStatus() {
  const [status, setStatus] = useState<{
    enabled: boolean;
    configured: boolean;
  } | null>(null);

  useState(() => {
    fetch('/api/integrations/winflex/sso')
      .then((res) => res.json())
      .then(setStatus)
      .catch(() => setStatus({ enabled: false, configured: false }));
  });

  if (!status) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <div
        className={`w-2 h-2 rounded-full ${
          status.enabled && status.configured
            ? 'bg-green-500'
            : status.configured
            ? 'bg-yellow-500'
            : 'bg-red-500'
        }`}
      />
      <span className="text-gray-600 dark:text-gray-400">
        WinFlex:{' '}
        {status.enabled && status.configured
          ? 'Connected'
          : status.configured
          ? 'Disabled'
          : 'Not Configured'}
      </span>
    </div>
  );
}

export default WinFlexLauncher;
