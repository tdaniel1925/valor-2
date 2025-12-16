"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Separator } from "@/components/ui";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CheckCircle, X, DollarSign, TrendingUp, Calendar, Shield, Download, Printer, Share2, Plus, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface ComparisonProduct {
  id: string;
  carrier: string;
  productName: string;
  productType: 'Term Life' | 'Whole Life' | 'Universal Life' | 'Indexed Universal Life' | 'Variable Universal Life';

  // Premiums
  monthlyPremium: number;
  annualPremium: number;
  totalPremiumOverTerm?: number;

  // Coverage
  deathBenefit: number;
  term?: number;

  // Cash Value (for permanent policies)
  cashValueYear10?: number;
  cashValueYear20?: number;
  cashValueYear30?: number;

  // Performance Metrics
  costPerThousand: number;
  internalRateOfReturn?: number;
  breakEvenYear?: number;

  // Features
  features: {
    cashValue: boolean;
    guaranteedDeathBenefit: boolean;
    levelPremium: boolean;
    flexiblePremium: boolean;
    acceleratedDeathBenefit: boolean;
    waiveOfPremium: boolean;
    conversion: boolean;
    loanProvision: boolean;
    dividends: boolean;
  };

  // Ratings & Score
  carrierRating: string;
  recommendationScore: number; // 0-100

  // Projections for charts
  yearlyProjections?: {
    year: number;
    premium: number;
    deathBenefit: number;
    cashValue?: number;
  }[];
}

interface ProductComparisonProps {
  products: ComparisonProduct[];
  onRemoveProduct?: (id: string) => void;
  onAddProduct?: () => void;
}

export function ProductComparison({ products, onRemoveProduct, onAddProduct }: ProductComparisonProps) {
  const [selectedMetric, setSelectedMetric] = useState<'premium' | 'cashValue' | 'deathBenefit'>('premium');
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const handleExport = () => {
    // TODO: Implement export to PDF
    console.log('Export to PDF');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Insurance Product Comparison',
          text: `Comparing ${products.length} insurance products`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // Prepare chart data for premium comparison
  const premiumComparisonData = products.map(product => ({
    name: product.productName.substring(0, 20),
    monthly: product.monthlyPremium,
    annual: product.annualPremium,
    carrier: product.carrier,
  }));

  // Prepare chart data for cash value comparison (if applicable)
  const cashValueComparisonData = [
    {
      year: 'Year 10',
      ...products.reduce((acc, product, idx) => ({
        ...acc,
        [`product${idx}`]: product.cashValueYear10 || 0,
      }), {})
    },
    {
      year: 'Year 20',
      ...products.reduce((acc, product, idx) => ({
        ...acc,
        [`product${idx}`]: product.cashValueYear20 || 0,
      }), {})
    },
    {
      year: 'Year 30',
      ...products.reduce((acc, product, idx) => ({
        ...acc,
        [`product${idx}`]: product.cashValueYear30 || 0,
      }), {})
    },
  ];

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

  // Key features to display
  const featureList = [
    { key: 'cashValue', label: 'Cash Value Accumulation' },
    { key: 'guaranteedDeathBenefit', label: 'Guaranteed Death Benefit' },
    { key: 'levelPremium', label: 'Level Premium' },
    { key: 'flexiblePremium', label: 'Flexible Premium' },
    { key: 'acceleratedDeathBenefit', label: 'Accelerated Death Benefit' },
    { key: 'waiveOfPremium', label: 'Waiver of Premium' },
    { key: 'conversion', label: 'Conversion Option' },
    { key: 'loanProvision', label: 'Policy Loans Available' },
    { key: 'dividends', label: 'Dividends (Participating)' },
  ];

  const visibleFeatures = showAllFeatures ? featureList : featureList.slice(0, 6);

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Products to Compare
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add products to start comparing insurance options side-by-side
          </p>
          {onAddProduct && (
            <Button onClick={onAddProduct}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header with Actions */}
      <div className="flex items-center justify-between print:mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 print:text-black">
            Product Comparison
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 print:text-gray-700 mt-1">
            Comparing {products.length} insurance products
          </p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleShare} variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button onClick={handleExport} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          {onAddProduct && products.length < 6 && (
            <Button onClick={onAddProduct} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Lowest Monthly Premium</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(Math.min(...products.map(p => p.monthlyPremium)))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Highest Death Benefit</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(Math.max(...products.map(p => p.deathBenefit)))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Best Cost per $1000</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(Math.min(...products.map(p => p.costPerThousand)))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Products with Cash Value</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {products.filter(p => p.features.cashValue).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Premium Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Premium Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={premiumComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => {
                  const product = premiumComparisonData.find(p => p.name === label);
                  return product ? `${product.carrier} - ${label}` : label;
                }}
              />
              <Legend />
              <Bar dataKey="monthly" fill="#3b82f6" name="Monthly Premium" />
              <Bar dataKey="annual" fill="#10b981" name="Annual Premium" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cash Value Comparison (if applicable) */}
      {products.some(p => p.features.cashValue) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Cash Value Growth Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cashValueComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                {products.map((product, idx) => (
                  <Bar
                    key={product.id}
                    dataKey={`product${idx}`}
                    fill={colors[idx % colors.length]}
                    name={product.productName.substring(0, 20)}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detailed Side-by-Side Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold min-w-[200px]">Feature</th>
                  {products.map((product) => (
                    <th key={product.id} className="px-4 py-3 text-center font-semibold min-w-[180px]">
                      <div className="flex flex-col items-center gap-2">
                        <Badge variant="outline">{product.carrier}</Badge>
                        <span className="text-xs font-normal">{product.productName}</span>
                        {onRemoveProduct && (
                          <Button
                            onClick={() => onRemoveProduct(product.id)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 print:hidden"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {/* Product Type */}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    Product Type
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="px-4 py-3 text-center">
                      <Badge variant="outline">{product.productType}</Badge>
                    </td>
                  ))}
                </tr>

                {/* Carrier Rating */}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    Carrier Rating
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="px-4 py-3 text-center font-semibold">
                      {product.carrierRating}
                    </td>
                  ))}
                </tr>

                {/* Recommendation Score */}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    Match Score
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 dark:bg-blue-400"
                            style={{ width: `${product.recommendationScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">{product.recommendationScore}%</span>
                      </div>
                    </td>
                  ))}
                </tr>

                <tr className="bg-gray-100 dark:bg-gray-900">
                  <td colSpan={products.length + 1} className="px-4 py-2 font-semibold text-gray-900 dark:text-gray-100">
                    Premiums & Coverage
                  </td>
                </tr>

                {/* Monthly Premium */}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    Monthly Premium
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="px-4 py-3 text-center font-semibold text-lg">
                      {formatCurrency(product.monthlyPremium)}
                    </td>
                  ))}
                </tr>

                {/* Annual Premium */}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    Annual Premium
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="px-4 py-3 text-center font-semibold">
                      {formatCurrency(product.annualPremium)}
                    </td>
                  ))}
                </tr>

                {/* Death Benefit */}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    Death Benefit
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="px-4 py-3 text-center font-semibold text-lg text-blue-600 dark:text-blue-400">
                      {formatCurrency(product.deathBenefit)}
                    </td>
                  ))}
                </tr>

                {/* Term Length (if applicable) */}
                {products.some(p => p.term) && (
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      Coverage Term
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="px-4 py-3 text-center">
                        {product.term ? `${product.term} years` : 'Lifetime'}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Cost per Thousand */}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    Cost per $1,000
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="px-4 py-3 text-center font-semibold">
                      {formatCurrency(product.costPerThousand)}
                    </td>
                  ))}
                </tr>

                {/* Cash Value Section */}
                {products.some(p => p.features.cashValue) && (
                  <>
                    <tr className="bg-gray-100 dark:bg-gray-900">
                      <td colSpan={products.length + 1} className="px-4 py-2 font-semibold text-gray-900 dark:text-gray-100">
                        Cash Value Accumulation
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        Cash Value Year 10
                      </td>
                      {products.map((product) => (
                        <td key={product.id} className="px-4 py-3 text-center font-semibold">
                          {product.cashValueYear10 ? formatCurrency(product.cashValueYear10) : 'N/A'}
                        </td>
                      ))}
                    </tr>

                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        Cash Value Year 20
                      </td>
                      {products.map((product) => (
                        <td key={product.id} className="px-4 py-3 text-center font-semibold">
                          {product.cashValueYear20 ? formatCurrency(product.cashValueYear20) : 'N/A'}
                        </td>
                      ))}
                    </tr>

                    {products.some(p => p.breakEvenYear) && (
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                          Break-Even Year
                        </td>
                        {products.map((product) => (
                          <td key={product.id} className="px-4 py-3 text-center font-semibold">
                            {product.breakEvenYear ? `Year ${product.breakEvenYear}` : 'N/A'}
                          </td>
                        ))}
                      </tr>
                    )}

                    {products.some(p => p.internalRateOfReturn) && (
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                          Internal Rate of Return
                        </td>
                        {products.map((product) => (
                          <td key={product.id} className="px-4 py-3 text-center font-semibold text-green-600 dark:text-green-400">
                            {product.internalRateOfReturn ? `${product.internalRateOfReturn.toFixed(2)}%` : 'N/A'}
                          </td>
                        ))}
                      </tr>
                    )}
                  </>
                )}

                {/* Features Section */}
                <tr className="bg-gray-100 dark:bg-gray-900">
                  <td colSpan={products.length + 1} className="px-4 py-2 font-semibold text-gray-900 dark:text-gray-100">
                    Policy Features & Benefits
                  </td>
                </tr>

                {visibleFeatures.map((feature) => (
                  <tr key={feature.key} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {feature.label}
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="px-4 py-3 text-center">
                        {product.features[feature.key as keyof typeof product.features] ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-400 dark:text-gray-600 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}

                {!showAllFeatures && featureList.length > 6 && (
                  <tr className="print:hidden">
                    <td colSpan={products.length + 1} className="px-4 py-3 text-center">
                      <Button
                        onClick={() => setShowAllFeatures(true)}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Show {featureList.length - 6} More Features
                      </Button>
                    </td>
                  </tr>
                )}

                {showAllFeatures && (
                  <tr className="print:hidden">
                    <td colSpan={products.length + 1} className="px-4 py-3 text-center">
                      <Button
                        onClick={() => setShowAllFeatures(false)}
                        variant="outline"
                        size="sm"
                      >
                        <Minus className="h-4 w-4 mr-2" />
                        Show Fewer Features
                      </Button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recommendation Summary */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Comparison Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Best Value (Cost per $1,000)
              </p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {products.reduce((prev, curr) =>
                  curr.costPerThousand < prev.costPerThousand ? curr : prev
                ).productName}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Lowest Premium
              </p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {products.reduce((prev, curr) =>
                  curr.monthlyPremium < prev.monthlyPremium ? curr : prev
                ).productName}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Top Recommendation
              </p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {products.reduce((prev, curr) =>
                  curr.recommendationScore > prev.recommendationScore ? curr : prev
                ).productName}
              </p>
            </div>
          </div>

          <Separator className="bg-blue-200 dark:bg-blue-800" />

          <p className="text-sm text-blue-900 dark:text-blue-100">
            This comparison is based on the information provided and current carrier rates. Individual needs
            may vary. Please consult with a licensed insurance professional to determine the best coverage
            for your specific situation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
