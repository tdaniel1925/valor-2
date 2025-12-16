'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { ProductComparison, ComparisonProduct } from '@/components/quotes/ProductComparison';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

// Sample products for comparison
const sampleProducts: ComparisonProduct[] = [
  {
    id: '1',
    carrier: 'Protective Life',
    productName: 'Protective Classic Choice Term 20',
    productType: 'Term Life',
    monthlyPremium: 33,
    annualPremium: 395,
    totalPremiumOverTerm: 7900,
    deathBenefit: 500000,
    term: 20,
    costPerThousand: 0.79,
    breakEvenYear: undefined,
    features: {
      cashValue: false,
      guaranteedDeathBenefit: true,
      levelPremium: true,
      flexiblePremium: false,
      acceleratedDeathBenefit: true,
      waiveOfPremium: true,
      conversion: true,
      loanProvision: false,
      dividends: false,
    },
    carrierRating: 'A+',
    recommendationScore: 92,
    yearlyProjections: Array.from({ length: 20 }, (_, i) => ({
      year: i + 1,
      premium: 395 * (i + 1),
      deathBenefit: 500000,
    })),
  },
  {
    id: '2',
    carrier: 'MassMutual',
    productName: 'MassMutual Whole Life',
    productType: 'Whole Life',
    monthlyPremium: 267,
    annualPremium: 3200,
    deathBenefit: 250000,
    cashValueYear10: 35000,
    cashValueYear20: 95000,
    cashValueYear30: 175000,
    costPerThousand: 12.80,
    internalRateOfReturn: 5.1,
    breakEvenYear: 14,
    features: {
      cashValue: true,
      guaranteedDeathBenefit: true,
      levelPremium: true,
      flexiblePremium: false,
      acceleratedDeathBenefit: true,
      waiveOfPremium: true,
      conversion: false,
      loanProvision: true,
      dividends: true,
    },
    carrierRating: 'A++',
    recommendationScore: 88,
    yearlyProjections: Array.from({ length: 40 }, (_, i) => ({
      year: i + 1,
      premium: Math.min(i + 1, 20) * 3200,
      deathBenefit: 250000 + Math.floor(i * 2500),
      cashValue: Math.floor(3200 * Math.min(i + 1, 20) * (0.3 + i * 0.015) * 1.35),
    })),
  },
  {
    id: '3',
    carrier: 'Pacific Life',
    productName: 'Pacific Index Advantage IUL',
    productType: 'Indexed Universal Life',
    monthlyPremium: 708,
    annualPremium: 8500,
    deathBenefit: 500000,
    cashValueYear10: 95000,
    cashValueYear20: 185000,
    cashValueYear30: 385000,
    costPerThousand: 17.00,
    internalRateOfReturn: 6.4,
    breakEvenYear: 11,
    features: {
      cashValue: true,
      guaranteedDeathBenefit: false,
      levelPremium: false,
      flexiblePremium: true,
      acceleratedDeathBenefit: true,
      waiveOfPremium: true,
      conversion: false,
      loanProvision: true,
      dividends: false,
    },
    carrierRating: 'A+',
    recommendationScore: 85,
    yearlyProjections: Array.from({ length: 40 }, (_, i) => ({
      year: i + 1,
      premium: Math.min(i + 1, 15) * 8500,
      deathBenefit: 500000,
      cashValue: Math.max(0, Math.floor(8500 * Math.min(i + 1, 15) * (0.4 + i * 0.025) - i * 1500)),
    })),
  },
];

export default function CompareProductsPage() {
  const [products, setProducts] = useState<ComparisonProduct[]>(sampleProducts);

  const handleRemoveProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleAddProduct = () => {
    alert('Product selection modal would open here. In a full implementation, this would allow users to search and add products from their quotes.');
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Product Comparison
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Compare insurance products side-by-side to find the best fit for your client
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">!</span>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Sample Data Loaded
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  This page is showing sample comparison data for demonstration purposes. In production,
                  this would connect to your quote system to compare actual products selected by the user.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Component */}
        <ProductComparison
          products={products}
          onRemoveProduct={handleRemoveProduct}
          onAddProduct={handleAddProduct}
        />
      </div>
    </AppLayout>
  );
}
