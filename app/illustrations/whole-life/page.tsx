'use client';

import AppLayout from '@/components/layout/AppLayout';
import { WholeLifeIllustration, WholeLifeIllustrationData } from '@/components/illustrations/WholeLifeIllustration';

// Sample data for demonstration
const sampleWholeLifeData: WholeLifeIllustrationData = {
  carrier: 'MassMutual',
  carrierRating: 'A++',
  productName: 'MassMutual Whole Life',
  policyType: 'Participating',
  dividendOption: 'Paid-Up Additions',

  clientName: 'Jane Doe',
  clientAge: 40,
  gender: 'Female',
  smoker: false,
  healthClass: 'Preferred',
  state: 'New York',

  faceAmount: 250000,
  annualPremium: 3200,
  monthlyPremium: 267,
  premiumPaymentPeriod: 20,
  totalPremiumsPaid: 64000,

  projectionYears: Array.from({ length: 40 }, (_, i) => {
    const year = i + 1;
    const age = 40 + i;
    const annualPremium = year <= 20 ? 3200 : 0;
    const cumulativePremium = Math.min(year, 20) * 3200;
    const guaranteedCashValue = Math.floor(cumulativePremium * (0.3 + year * 0.015));
    const illustratedCashValue = Math.floor(guaranteedCashValue * 1.35);
    const dividends = year > 3 ? Math.floor(2500 + year * 150) : 0;

    return {
      year,
      age,
      annualPremium,
      cumulativePremium,
      guaranteedCashValue,
      illustratedCashValue,
      guaranteedDeathBenefit: 250000,
      illustratedDeathBenefit: 250000 + Math.floor(illustratedCashValue * 0.15),
      dividends,
      cumulativeDividends: year > 3 ? Array.from({ length: year - 3 }, (_, j) => 2500 + (j + 4) * 150).reduce((a, b) => a + b, 0) : 0,
      surrenderValue: year <= 2 ? 0 : Math.floor(illustratedCashValue * (0.8 + year * 0.01)),
      loanValue: Math.floor(illustratedCashValue * 0.9),
    };
  }),

  dividendInformation: {
    currentDividendRate: 6.2,
    historicalRates: [
      { year: 2019, rate: 6.4 },
      { year: 2020, rate: 6.3 },
      { year: 2021, rate: 6.1 },
      { year: 2022, rate: 6.0 },
      { year: 2023, rate: 6.2 },
    ],
    illustratedRate: 6.2,
    guaranteedRate: 4.0,
    dividendScale: '2024 Current Scale',
  },

  loanProvisions: {
    maximumLoanPercentage: 90,
    loanInterestRate: 5.0,
    loanType: 'Fixed',
    repaymentTerms: 'Flexible repayment - interest and principal can be paid at any time. Unpaid interest is added to loan balance annually.',
    outstandingLoanImpact: 'Outstanding loans and accrued interest reduce the death benefit and cash value. If total loan balance exceeds the cash value, policy will lapse unless additional premiums are paid.',
  },

  riders: {
    acceleratedDeathBenefit: true,
    waiveOfPremium: { premium: 85 },
    guaranteedInsurability: {
      coverage: 25000,
      premium: 120,
      optionDates: [43, 46, 49, 52, 55],
    },
    accidentalDeath: { multiplier: 1, premium: 75 },
    chronicIllness: { percentage: 75, premium: 95 },
  },

  paidUpOptions: {
    reducedPaidUp: {
      availableAt: 3,
      amount: 185000,
    },
    extendedTerm: {
      availableAt: 3,
      years: 28,
      days: 150,
    },
  },

  metrics: {
    internalRateOfReturn: {
      year10: 2.8,
      year20: 4.2,
      lifeExpectancy: 5.1,
    },
    costPerThousand: {
      year1: 12.80,
      year10: 8.40,
      year20: 5.20,
    },
    breakEvenYear: 14,
  },

  illustrationDate: new Date().toISOString(),
  illustrationNumber: 'ILL-WL-2024-005678',
  agentName: 'Michael Chen',
  agentLicense: 'NY-LIC-67890',
  assumedInterestRate: 6.2,
};

export default function WholeLifeIllustrationPage() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <WholeLifeIllustration data={sampleWholeLifeData} />
      </div>
    </AppLayout>
  );
}
