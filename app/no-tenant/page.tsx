/**
 * No Tenant Page
 *
 * Displayed when a user visits the root domain (valorfs.app) without a subdomain.
 * This page should guide them to their agency's subdomain or to sign up.
 */

import Link from 'next/link';

export default function NoTenantPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          No Agency Selected
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          To access Valor, you need to visit your agency's unique subdomain.
        </p>

        {/* Example */}
        <div className="bg-gray-50 rounded-md p-4 mb-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Example:</p>
          <code className="text-blue-600 font-mono text-sm">
            your-agency.valorfs.app
          </code>
        </div>

        {/* Instructions */}
        <div className="text-left mb-6 space-y-3">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-blue-600 text-sm font-semibold">1</span>
            </div>
            <div>
              <p className="text-sm text-gray-700">
                Check your email for your agency's subdomain link
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-blue-600 text-sm font-semibold">2</span>
            </div>
            <div>
              <p className="text-sm text-gray-700">
                Contact your agency administrator for the correct URL
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-blue-600 text-sm font-semibold">3</span>
            </div>
            <div>
              <p className="text-sm text-gray-700">
                New agency? Contact us to get started
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="mailto:support@valorfinancial.com?subject=Need help accessing Valor"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors"
          >
            Contact Support
          </Link>

          <Link
            href="https://valorfinancial.com"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-md transition-colors"
          >
            Learn More About Valor
          </Link>
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500 mt-6">
          Having trouble? Email us at{' '}
          <a
            href="mailto:support@valorfinancial.com"
            className="text-blue-600 hover:underline"
          >
            support@valorfinancial.com
          </a>
        </p>
      </div>
    </div>
  );
}
