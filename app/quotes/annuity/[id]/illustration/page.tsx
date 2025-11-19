'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AnnuityIllustration } from '@/components/illustrations/AnnuityIllustration';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { AnnuityIllustrationData } from '@/components/illustrations/AnnuityIllustration';

// Mock data generator for development
function generateMockIllustration(quoteId: string): AnnuityIllustrationData {
  const initialPremium = 100000;
  const guaranteedRate = 5.25;
  const currentRate = 5.75;
  const years = 10;
  const surrenderPeriod = 7;
  const clientAge = 65;

  const projectionYears = [];

  for (let year = 1; year <= years; year++) {
    const age = clientAge + year;
    const guaranteedValue = initialPremium * Math.pow(1 + guaranteedRate / 100, year);
    const currentValue = initialPremium * Math.pow(1 + currentRate / 100, year);

    // Surrender charges decrease linearly over surrender period
    let surrenderChargePercentage = 0;
    if (year <= surrenderPeriod) {
      surrenderChargePercentage = ((surrenderPeriod - year + 1) / surrenderPeriod) * 8; // Max 8% charge
    }

    const surrenderCharge = guaranteedValue * (surrenderChargePercentage / 100);
    const surrenderValue = guaranteedValue - surrenderCharge;
    const cumulativeInterest = guaranteedValue - initialPremium;
    const deathBenefit = Math.max(guaranteedValue, initialPremium);

    projectionYears.push({
      year,
      age,
      guaranteedValue,
      currentValue,
      surrenderValue,
      surrenderCharge,
      surrenderChargePercentage,
      cumulativeInterest,
      deathBenefit,
    });
  }

  return {
    carrier: 'American National Insurance',
    carrierRating: 'A+',
    productName: 'PalladiuM® 10 Multi-Year Guarantee Annuity',
    annuityType: 'MYGA (Multi-Year Guaranteed Annuity)',

    clientName: 'John Smith',
    clientAge,
    state: 'CA',

    initialPremium,
    qualified: true,

    guaranteedRate,
    currentRate,

    years,
    surrenderPeriod,
    projectionYears,

    features: {
      deathBenefit: true,
      nursingHomeBenefit: true,
      terminalIllnessBenefit: true,
      freeWithdrawal: true,
      freeWithdrawalPercentage: 10,
      bailoutProvision: false,
      marketValueAdjustment: true,
    },

    riderOptions: [
      'Enhanced Death Benefit Rider',
      'Income Rider with Guaranteed Lifetime Withdrawal',
      'Long-Term Care Rider',
    ],

    indexingStrategies: [
      'S&P 500 Point-to-Point',
      'S&P 500 Monthly Average',
      'Barclays U.S. Dynamic Balance II ER Index',
    ],

    illustrationDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    illustrationNumber: `ILL-${quoteId}-${Date.now()}`,
  };
}

export default function AnnuityIllustrationPage() {
  const params = useParams();
  const quoteId = params?.id as string;

  const [illustrationData, setIllustrationData] = useState<AnnuityIllustrationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, this would fetch from API
    // For now, generate mock data
    const loadIllustration = async () => {
      setLoading(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const data = generateMockIllustration(quoteId);
      setIllustrationData(data);
      setLoading(false);
    };

    if (quoteId) {
      loadIllustration();
    }
  }, [quoteId]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading illustration...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!illustrationData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground">Illustration not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <AnnuityIllustration data={illustrationData} />
    </div>
  );
}
