/**
 * Unauthorized Page
 *
 * Displayed when a user is authenticated but tries to access a tenant
 * they don't belong to. For example, a user from Agency A tries to access
 * Agency B's subdomain.
 */

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function UnauthorizedPage() {
  const [currentSubdomain, setCurrentSubdomain] = useState<string>('');

  useEffect(() => {
    // Extract subdomain from current hostname
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length > 1) {
      setCurrentSubdomain(parts[0]);
    }
  }, []);

  const handleSignOut = async () => {
    // Redirect to auth signout endpoint
    window.location.href = '/api/auth/signout';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-amber-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-8 h-8 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Access Denied
        </h1>

        {/* Subdomain Display */}
        {currentSubdomain && (
          <div className="bg-yellow-50 rounded-md p-3 mb-4 border border-yellow-200">
            <p className="text-sm text-yellow-700 mb-1">Trying to access:</p>
            <code className="text-yellow-800 font-mono text-sm font-semibold">
              {currentSubdomain}.valorfs.app
            </code>
          </div>
        )}

        {/* Description */}
        <p className="text-gray-600 mb-6">
          You don't have permission to access this agency's data. Your account
          is associated with a different agency.
        </p>

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6 text-left">
          <p className="text-sm font-medium text-blue-900 mb-2">
            Why am I seeing this?
          </p>
          <p className="text-sm text-blue-700 mb-3">
            Valor uses secure multi-tenant architecture to keep each agency's
            data completely separate and private.
          </p>
          <p className="text-sm text-blue-700">
            You can only access the agency subdomain your account is registered
            under.
          </p>
        </div>

        {/* What to do */}
        <div className="text-left mb-6 space-y-3">
          <p className="text-sm font-medium text-gray-900 mb-2">
            What should I do?
          </p>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-blue-600 text-sm font-semibold">1</span>
            </div>
            <div>
              <p className="text-sm text-gray-700">
                Sign out and sign in with the correct account
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-blue-600 text-sm font-semibold">2</span>
            </div>
            <div>
              <p className="text-sm text-gray-700">
                Check your email for the correct agency subdomain link
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-blue-600 text-sm font-semibold">3</span>
            </div>
            <div>
              <p className="text-sm text-gray-700">
                Contact support if you believe this is an error
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleSignOut}
            className="block w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-4 rounded-md transition-colors"
          >
            Sign Out
          </button>

          <Link
            href="/"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-md transition-colors"
          >
            Go to Homepage
          </Link>

          <Link
            href="mailto:support@valorfinancial.com?subject=Unauthorized access issue"
            className="block w-full text-blue-600 hover:text-blue-700 font-medium py-2 transition-colors"
          >
            Contact Support
          </Link>
        </div>

        {/* Security Note */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center text-gray-500">
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xs">
              Your data is protected by enterprise-grade security
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
