'use client';

import AppLayout from '@/components/layout/AppLayout';
import { TermLifeIllustration, TermLifeIllustrationData } from '@/components/illustrations/TermLifeIllustration';
import { WinFlexLauncher } from '@/components/integrations/WinFlexLauncher';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Demo user for WinFlex SSO
const demoUser = {
  id: 'demo-user-001',
  firstName: 'Sarah',
  lastName: 'Johnson',
  email: 'sarah.johnson@valorfinancial.com',
  companyName: 'Valor Financial Specialists',
  phone: '(555) 123-4567',
};

// Sample data for demonstration
const sampleTermLifeData: TermLifeIllustrationData = {
  carrier: 'Protective Life',
  carrierRating: 'A+',
  productName: 'Protective Classic Choice Term',
  policyType: 'Level Term',

  clientName: 'John Smith',
  clientAge: 35,
  gender: 'Male',
  smoker: false,
  healthClass: 'Preferred Plus',
  state: 'California',

  coverageAmount: 500000,
  term: 20,
  annualPremium: 395,
  monthlyPremium: 33,
  totalPremiumOverTerm: 7900,

  projectionYears: Array.from({ length: 20 }, (_, i) => ({
    year: i + 1,
    age: 35 + i,
    premium: 395,
    deathBenefit: 500000,
    cumulativePremium: 395 * (i + 1),
  })),

  riders: {
    acceleratedDeathBenefit: true,
    waiveOfPremium: true,
    accidentalDeath: { multiplier: 2, premium: 50 },
    childTerm: { coverage: 10000, premium: 60 },
    conversion: { available: true, deadline: 65 },
  },

  renewalOption: true,
  renewalProjections: [
    { age: 55, annualPremium: 1250 },
    { age: 56, annualPremium: 1380 },
    { age: 57, annualPremium: 1520 },
    { age: 58, annualPremium: 1680 },
    { age: 59, annualPremium: 1860 },
  ],

  conversionOptions: [
    { productName: 'Protective Indexed Choice UL', type: 'Indexed Universal Life', deadlineAge: 65 },
    { productName: 'Protective Classic Choice VUL', type: 'Variable Universal Life', deadlineAge: 65 },
  ],

  illustrationDate: new Date().toISOString(),
  illustrationNumber: 'ILL-2024-001234',
  agentName: 'Sarah Johnson',
  agentLicense: 'CA-LIC-12345',
};

export default function TermLifeIllustrationPage() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* WinFlex Integration Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Create New Illustration</span>
              <WinFlexLauncher
                user={demoUser}
                buttonText="Launch WinFlex"
                variant="default"
                className="whitespace-nowrap"
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Use WinFlex Web to create professional life insurance illustrations with real-time carrier quotes.
              Your session will be automatically authenticated.
            </p>
          </CardContent>
        </Card>

        {/* Existing Illustration */}
        <TermLifeIllustration data={sampleTermLifeData} />
      </div>
    </AppLayout>
  );
}
