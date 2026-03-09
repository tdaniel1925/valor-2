'use client';

import { useState } from 'react';
import { Copy, Check, Mail } from 'lucide-react';

interface InboundEmailCardProps {
  emailAddress: string;
}

export default function InboundEmailCard({ emailAddress }: InboundEmailCardProps) {
  const [copied, setCopied] = useState(false);

  const fullEmail = `${emailAddress}@shwunde745.resend.app`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            SmartOffice Email Address
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Forward SmartOffice reports to this email for automatic import
          </p>

          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-mono text-gray-900">
              {fullEmail}
            </code>

            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
              aria-label="Copy email address"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
