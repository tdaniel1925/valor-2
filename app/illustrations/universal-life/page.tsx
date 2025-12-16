'use client';

import AppLayout from '@/components/layout/AppLayout';
import { UniversalLifeIllustration, UniversalLifeIllustrationData } from '@/components/illustrations/UniversalLifeIllustration';

// Sample data for demonstration
const sampleUniversalLifeData: UniversalLifeIllustrationData = {
  carrier: 'Pacific Life',
  carrierRating: 'A+',
  productName: 'Pacific Index Advantage',
  policyType: 'Indexed',
  deathBenefitOption: 'Level',

  clientName: 'Robert Williams',
  clientAge: 45,
  gender: 'Male',
  smoker: false,
  healthClass: 'Standard Plus',
  state: 'Texas',

  specifiedAmount: 500000,
  initialDeathBenefit: 500000,
  plannedPremium: 8500,
  minimumPremium: 2100,
  maximumPremium: 42000,
  targetPremium: 8500,

  creditingStrategy: {
    type: 'Indexed',
    currentRate: 7.5,
    guaranteedMinimum: 1.0,
    illustratedRate: 6.5,
    cappedRate: 12.0,
    participationRate: 100,
    indexName: 'S&P 500 Annual Point-to-Point',
  },

  costOfInsurance: {
    currentCOI: 125,
    guaranteedMaximumCOI: 285,
    mortalityCharges: 'Based on 2017 CSO mortality table',
    monthlyDeductions: {
      basePolicy: 125,
      riders: 45,
      administrative: 15,
    },
  },

  projections: {
    illustrated: Array.from({ length: 40 }, (_, i) => {
      const year = i + 1;
      const age = 45 + i;
      const annualPremium = year <= 15 ? 8500 : 0;
      const cumulativePremium = Math.min(year, 15) * 8500;
      const cashValue = Math.floor(cumulativePremium * (0.4 + year * 0.025) - year * 1500);
      const interestCredited = Math.floor(cashValue * 0.065);
      const costOfInsurance = 125 + year * 15;

      return {
        year,
        age,
        annualPremium,
        cumulativePremium,
        cashValue: Math.max(0, cashValue),
        deathBenefit: 500000,
        surrenderValue: year <= 10 ? Math.floor(cashValue * (0.7 + year * 0.03)) : cashValue,
        costOfInsurance,
        interestCredited,
        endOfYearLoanValue: Math.floor(cashValue * 0.9),
      };
    }),
    guaranteed: Array.from({ length: 40 }, (_, i) => {
      const year = i + 1;
      const age = 45 + i;
      const annualPremium = year <= 15 ? 8500 : 0;
      const cumulativePremium = Math.min(year, 15) * 8500;
      const cashValue = Math.floor(cumulativePremium * (0.2 + year * 0.01) - year * 2000);
      const costOfInsurance = 285 + year * 25;

      return {
        year,
        age,
        annualPremium,
        cumulativePremium,
        cashValue: Math.max(0, cashValue),
        deathBenefit: 500000,
        surrenderValue: year <= 10 ? Math.floor(cashValue * 0.6) : cashValue,
        costOfInsurance,
        interestCredited: Math.floor(cashValue * 0.01),
        endOfYearLoanValue: Math.floor(cashValue * 0.9),
      };
    }),
  },

  premiumScenarios: [
    {
      name: 'Minimum Premium',
      description: 'Pay minimum to keep policy in force',
      annualPremium: 2100,
      yearsOfPayment: 40,
      totalPremiumsPaid: 84000,
      cashValueAt20: 15000,
      lapseYear: 35,
    },
    {
      name: 'Target Premium (Recommended)',
      description: 'Balanced approach for illustrated performance',
      annualPremium: 8500,
      yearsOfPayment: 15,
      totalPremiumsPaid: 127500,
      cashValueAt20: 185000,
    },
    {
      name: 'Accelerated Funding',
      description: 'Pay up policy faster with higher premiums',
      annualPremium: 15000,
      yearsOfPayment: 10,
      totalPremiumsPaid: 150000,
      cashValueAt20: 245000,
    },
    {
      name: '7-Pay Premium',
      description: 'Maximum premium before MEC limits',
      annualPremium: 18143,
      yearsOfPayment: 7,
      totalPremiumsPaid: 127001,
      cashValueAt20: 265000,
    },
  ],

  riders: {
    acceleratedDeathBenefit: true,
    waiveOfPremium: { premium: 180 },
    chronicIllness: { percentage: 90, premium: 225 },
    noLapseguarantee: { period: 15, requiresMinimumPremium: 8500 },
    overloanProtection: true,
  },

  loanProvisions: {
    maximumLoanPercentage: 90,
    loanInterestRate: 5.0,
    loanType: 'Wash',
    washLoanRate: 5.0,
  },

  surrenderCharges: {
    schedule: [
      { year: 1, percentage: 10 },
      { year: 2, percentage: 9 },
      { year: 3, percentage: 8 },
      { year: 4, percentage: 7 },
      { year: 5, percentage: 6 },
      { year: 6, percentage: 5 },
      { year: 7, percentage: 4 },
      { year: 8, percentage: 3 },
      { year: 9, percentage: 2 },
      { year: 10, percentage: 1 },
    ],
    duration: 10,
  },

  metrics: {
    internalRateOfReturn: {
      year10: 3.2,
      year20: 5.8,
      lifeExpectancy: 6.4,
    },
    solveForPremium: {
      toAge100: 6850,
      toAge121: 8200,
    },
  },

  illustrationDate: new Date().toISOString(),
  illustrationNumber: 'ILL-IUL-2024-009876',
  agentName: 'Emily Davis',
  agentLicense: 'TX-LIC-54321',
};

export default function UniversalLifeIllustrationPage() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <UniversalLifeIllustration data={sampleUniversalLifeData} />
      </div>
    </AppLayout>
  );
}
