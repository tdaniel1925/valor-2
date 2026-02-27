/**
 * Tenant Not Found Page
 *
 * Displayed when a user visits a subdomain that doesn't exist in the database,
 * or when the tenant is inactive/suspended.
 */

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function TenantNotFoundPage() {
  const [subdomain, setSubdomain] = useState<string>('');

  useEffect(() => {
    // Extract subdomain from current hostname
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length > 1) {
      setSubdomain(parts[0]);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Agency Not Found
        </h1>

        {/* Subdomain Display */}
        {subdomain && (
          <div className="bg-red-50 rounded-md p-3 mb-4 border border-red-200">
            <code className="text-red-700 font-mono text-sm">
              {subdomain}.valorfs.app
            </code>
          </div>
        )}

        {/* Description */}
        <p className="text-gray-600 mb-6">
          We couldn't find an agency with this subdomain. This could happen if:
        </p>

        {/* Reasons */}
        <div className="text-left mb-6 space-y-3">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-gray-700">
              The subdomain was typed incorrectly
            </p>
          </div>

          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-gray-700">
              The agency account hasn't been set up yet
            </p>
          </div>

          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-gray-700">
              The agency account has been suspended
            </p>
          </div>
        </div>

        {/* What to do */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <p className="text-sm font-medium text-blue-900 mb-2">
            What should I do?
          </p>
          <p className="text-sm text-blue-700">
            Check your email for the correct link, or contact your agency
            administrator for help.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="mailto:support@valorfinancial.com?subject=Cannot access agency subdomain"
            className="block w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-md transition-colors"
          >
            Contact Support
          </Link>

          <Link
            href="/"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-md transition-colors"
          >
            Go to Homepage
          </Link>
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500 mt-6">
          Setting up a new agency?{' '}
          <a
            href="mailto:sales@valorfinancial.com"
            className="text-blue-600 hover:underline"
          >
            Contact Sales
          </a>
        </p>
      </div>
    </div>
  );
}
