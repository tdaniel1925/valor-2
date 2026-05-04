'use client';

import AppLayout from '@/components/layout/AppLayout';
import { IPipelineLauncher } from '@/components/integrations/IPipelineLauncher';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  FileText,
  Send,
  ShieldCheck,
  ClipboardList,
  Loader2,
} from 'lucide-react';

export default function IPipelineIntegrationPage() {
  const { user, loading, error } = useCurrentUser();

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AppLayout>
    );
  }

  if (error || !user) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 max-w-3xl">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <p className="text-red-600 dark:text-red-400">
              {error || 'Failed to load user data. Please refresh the page.'}
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 p-8 md:p-12 mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="px-3 py-1 bg-white/20 rounded-full text-white/90 text-xs font-medium tracking-wide uppercase">
                iPipeline
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              iGo E-Applications
            </h1>
            <p className="text-emerald-100 text-lg mb-8 max-w-xl">
              Submit life insurance applications electronically with real-time underwriting and instant decisions.
            </p>
            <IPipelineLauncher
              user={user}
              defaultProduct="igo"
              variant="default"
              size="lg"
              buttonText="Launch iGo"
              className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg px-8 py-3 text-base font-semibold"
            />
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FeatureCard
            icon={<FileText className="h-6 w-6" />}
            title="E-Applications"
            description="Digital applications for all major carriers"
            color="emerald"
          />
          <FeatureCard
            icon={<Send className="h-6 w-6" />}
            title="Instant Submit"
            description="Submit directly to carriers electronically"
            color="teal"
          />
          <FeatureCard
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Underwriting"
            description="Real-time decisions and status tracking"
            color="cyan"
          />
          <FeatureCard
            icon={<ClipboardList className="h-6 w-6" />}
            title="Requirements"
            description="Track outstanding requirements in one place"
            color="sky"
          />
        </div>
      </div>
    </AppLayout>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    teal: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
    cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
      <div className={`inline-flex p-2.5 rounded-lg mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}
