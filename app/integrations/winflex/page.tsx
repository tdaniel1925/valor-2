'use client';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import AppLayout from '@/components/layout/AppLayout';
import { WinFlexLauncher } from '@/components/integrations/WinFlexLauncher';
import { Loader2, BarChart3, FileText, Users, Palette } from 'lucide-react';

export default function WinFlexIntegrationPage() {
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 md:p-12 mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="px-3 py-1 bg-white/20 rounded-full text-white/90 text-xs font-medium tracking-wide uppercase">
                Powered by Zinnia
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              WinFlex Web
            </h1>
            <p className="text-blue-100 text-lg mb-8 max-w-xl">
              Create professional life insurance illustrations with real-time quotes from 100+ carriers.
            </p>
            <WinFlexLauncher
              user={{
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                companyName: 'Valor Financial Specialists',
              }}
              buttonText="Launch WinFlex"
              variant="default"
              size="lg"
              className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg px-8 py-3 text-base font-semibold"
            />
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FeatureCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="Multi-Carrier Quotes"
            description="Compare rates across 100+ carriers instantly"
            color="blue"
          />
          <FeatureCard
            icon={<FileText className="h-6 w-6" />}
            title="Illustrations"
            description="Term, Whole, Universal, Variable Life & more"
            color="indigo"
          />
          <FeatureCard
            icon={<Users className="h-6 w-6" />}
            title="Client Ready"
            description="Professional PDFs for client presentations"
            color="violet"
          />
          <FeatureCard
            icon={<Palette className="h-6 w-6" />}
            title="Custom Branding"
            description="Your agency logo on every illustration"
            color="purple"
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
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
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
