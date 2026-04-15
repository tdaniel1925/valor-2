'use client';

import AppLayout from '@/components/layout/AppLayout';

export default function ReportsPage() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <svg
            className="w-24 h-24 text-gray-400 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Coming Soon</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md">
            Our comprehensive reports and analytics suite is currently under development.
            Check back soon for powerful insights into your business performance.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
