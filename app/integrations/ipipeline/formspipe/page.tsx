'use client';

import AppLayout from '@/components/layout/AppLayout';
import { IPipelineLauncher } from '@/components/integrations/IPipelineLauncher';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Loader2 } from 'lucide-react';

export default function FormsPipeLauncherPage() {
  const { user, loading, error } = useCurrentUser();

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="max-w-2xl mx-auto flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !user) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <p className="text-red-600 dark:text-red-400">
                {error || 'Failed to load user data. Please refresh the page.'}
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              FormsPipe Insurance Forms
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Launch secure SSO session to iPipeline FormsPipe
            </p>
          </div>

          {/* Launch Button */}
          <IPipelineLauncher
            user={user}
            defaultProduct="formspipe"
            variant="default"
            size="lg"
            buttonText="Launch FormsPipe"
          />
        </div>
      </div>
    </AppLayout>
  );
}
