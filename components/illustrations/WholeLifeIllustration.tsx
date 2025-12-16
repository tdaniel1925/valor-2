"use client";

import { Card, CardContent, CardHeader, CardTitle, Badge, Separator } from "@/components/ui";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CheckCircle, DollarSign, TrendingUp, Shield, Percent, CreditCard, Calendar, AlertTriangle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface WholeLifeIllustrationData {
  // Product Information
  carrier: string;
  carrierRating: string;
  productName: string;
  policyType: 'Participating' | 'Non-Participating';
  dividendOption: 'Paid-Up Additions' | 'Cash' | 'Premium Reduction' | 'Accumulation' | 'Term Insurance';

  // Client Information
  clientName: string;
  clientAge: number;
  gender: 'Male' | 'Female';
  smoker: boolean;
  healthClass: 'Preferred Plus' | 'Preferred' | 'Standard Plus' | 'Standard';
  state: string;

  // Coverage Information
  faceAmount: number;
  annualPremium: number;
  monthlyPremium: number;
  premiumPaymentPeriod: number | 'Life'; // Number of years or 'Life'
  totalPremiumsPaid: number;

  // Cash Value Projections
  projectionYears: {
    year: number;
    age: number;
    annualPremium: number;
    cumulativePremium: number;
    guaranteedCashValue: number;
    illustratedCashValue: number;
    guaranteedDeathBenefit: number;
    illustratedDeathBenefit: number;
    dividends?: number;
    cumulativeDividends?: number;
    surrenderValue: number;
    loanValue: number;
  }[];

  // Dividend Information (for participating policies)
  dividendInformation?: {
    currentDividendRate: number;
    historicalRates: { year: number; rate: number }[];
    illustratedRate: number;
    guaranteedRate: number;
    dividendScale: string;
  };

  // Loan Provisions
  loanProvisions: {
    maximumLoanPercentage: number;
    loanInterestRate: number;
    loanType: 'Fixed' | 'Variable';
    repaymentTerms: string;
    outstandingLoanImpact: string;
  };

  // Riders & Benefits
  riders: {
    acceleratedDeathBenefit?: boolean;
    waiveOfPremium?: boolean;
    guaranteedInsurability?: {
      coverage: number;
      premium: number;
      optionDates: number[];
    };
    accidentalDeath?: { multiplier: number; premium: number };
    chronicIllness?: { percentage: number; premium: number };
    termInsurance?: { coverage: number; premium: number };
  };

  // Paid-Up Options
  paidUpOptions?: {
    reducedPaidUp: {
      availableAt: number;
      amount: number;
    };
    extendedTerm: {
      availableAt: number;
      years: number;
      days: number;
    };
  };

  // Performance Metrics
  metrics: {
    internalRateOfReturn: {
      year10: number;
      year20: number;
      lifeExpectancy: number;
    };
    costPerThousand: {
      year1: number;
      year10: number;
      year20: number;
    };
    breakEvenYear: number;
  };

  // Metadata
  illustrationDate: string;
  illustrationNumber: string;
  agentName?: string;
  agentLicense?: string;
  assumedInterestRate: number;
}

interface WholeLifeIllustrationProps {
  data: WholeLifeIllustrationData;
}

export function WholeLifeIllustration({ data }: WholeLifeIllustrationProps) {
  // Prepare chart data
  const cashValueChartData = data.projectionYears.map(year => ({
    year: year.year,
    age: year.age,
    guaranteed: year.guaranteedCashValue,
    illustrated: year.illustratedCashValue,
    premium: year.cumulativePremium,
  }));

  const deathBenefitChartData = data.projectionYears.map(year => ({
    year: year.year,
    guaranteed: year.guaranteedDeathBenefit,
    illustrated: year.illustratedDeathBenefit,
  }));

  const dividendChartData = data.projectionYears
    .filter(year => year.dividends !== undefined)
    .map(year => ({
      year: year.year,
      dividends: year.dividends,
      cumulative: year.cumulativeDividends,
    }));

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6 print:p-4">
      {/* Header */}
      <div className="flex items-center justify-between print:mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 print:text-black">
            Whole Life Insurance Illustration
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 print:text-gray-700 mt-1">
            Illustration Date: {formatDate(data.illustrationDate)} | Illustration #{data.illustrationNumber}
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {data.carrier}
        </Badge>
      </div>

      {/* Client & Policy Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Name:</span>
              <span className="font-semibold">{data.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Age:</span>
              <span className="font-semibold">{data.clientAge}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Gender:</span>
              <span className="font-semibold">{data.gender}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Smoker Status:</span>
              <span className="font-semibold">{data.smoker ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Health Class:</span>
              <span className="font-semibold">{data.healthClass}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">State:</span>
              <span className="font-semibold">{data.state}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Policy Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Product:</span>
              <span className="font-semibold">{data.productName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Type:</span>
              <Badge variant="secondary">{data.policyType}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Face Amount:</span>
              <span className="font-semibold text-lg">{formatCurrency(data.faceAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Annual Premium:</span>
              <span className="font-semibold text-lg">{formatCurrency(data.annualPremium)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Monthly Premium:</span>
              <span className="font-semibold">{formatCurrency(data.monthlyPremium)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Payment Period:</span>
              <span className="font-semibold">
                {data.premiumPaymentPeriod === 'Life' ? 'Lifetime' : `${data.premiumPaymentPeriod} years`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Dividend Option:</span>
              <span className="font-semibold text-sm">{data.dividendOption}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Key Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Break-Even Year</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                Year {data.metrics.breakEvenYear}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">IRR @ Age {data.clientAge + 20}</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {data.metrics.internalRateOfReturn.year20.toFixed(2)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">CV @ Age {data.clientAge + 20}</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(data.projectionYears[19]?.illustratedCashValue || 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Premiums Paid</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(data.totalPremiumsPaid)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="print:hidden" />

      {/* Tabbed Content */}
      <Tabs defaultValue="cash-value" className="w-full">
        <TabsList className="grid w-full grid-cols-5 print:hidden">
          <TabsTrigger value="cash-value">Cash Value</TabsTrigger>
          <TabsTrigger value="death-benefit">Death Benefit</TabsTrigger>
          <TabsTrigger value="dividends">Dividends</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="riders">Riders</TabsTrigger>
        </TabsList>

        {/* Cash Value Projections Tab */}
        <TabsContent value="cash-value" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cash Value Accumulation</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Illustrated vs Guaranteed Cash Values Over Time
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={cashValueChartData}>
                  <defs>
                    <linearGradient id="illustratedCV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="guaranteedCV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="year"
                    label={{ value: 'Policy Year', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    label={{ value: 'Cash Value ($)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="illustrated"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#illustratedCV)"
                    name="Illustrated Cash Value"
                  />
                  <Area
                    type="monotone"
                    dataKey="guaranteed"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#guaranteedCV)"
                    name="Guaranteed Cash Value"
                  />
                  <Line
                    type="monotone"
                    dataKey="premium"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Cumulative Premium"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Year-by-Year Projection Table */}
          <Card>
            <CardHeader>
              <CardTitle>Year-by-Year Cash Value Projections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Year</th>
                      <th className="px-4 py-3 text-left font-semibold">Age</th>
                      <th className="px-4 py-3 text-right font-semibold">Annual Premium</th>
                      <th className="px-4 py-3 text-right font-semibold">Cumulative Premium</th>
                      <th className="px-4 py-3 text-right font-semibold">Guaranteed CV</th>
                      <th className="px-4 py-3 text-right font-semibold">Illustrated CV</th>
                      <th className="px-4 py-3 text-right font-semibold">Surrender Value</th>
                      <th className="px-4 py-3 text-right font-semibold">Loan Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {data.projectionYears.map((year) => (
                      <tr key={year.year} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 font-medium">{year.year}</td>
                        <td className="px-4 py-3">{year.age}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(year.annualPremium)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(year.cumulativePremium)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(year.guaranteedCashValue)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-600 dark:text-blue-400">
                          {formatCurrency(year.illustratedCashValue)}
                        </td>
                        <td className="px-4 py-3 text-right">{formatCurrency(year.surrenderValue)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(year.loanValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Death Benefit Tab */}
        <TabsContent value="death-benefit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Death Benefit Projections</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Guaranteed vs Illustrated Death Benefit (includes dividends for participating policies)
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={deathBenefitChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="year"
                    label={{ value: 'Policy Year', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    label={{ value: 'Death Benefit ($)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="illustrated"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    name="Illustrated Death Benefit"
                  />
                  <Line
                    type="monotone"
                    dataKey="guaranteed"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Guaranteed Death Benefit"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Death Benefit Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Year</th>
                      <th className="px-4 py-3 text-left font-semibold">Age</th>
                      <th className="px-4 py-3 text-right font-semibold">Guaranteed DB</th>
                      <th className="px-4 py-3 text-right font-semibold">Illustrated DB</th>
                      <th className="px-4 py-3 text-right font-semibold">Increase from Base</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {data.projectionYears.map((year) => (
                      <tr key={year.year} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 font-medium">{year.year}</td>
                        <td className="px-4 py-3">{year.age}</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(year.guaranteedDeathBenefit)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-600 dark:text-blue-400">
                          {formatCurrency(year.illustratedDeathBenefit)}
                        </td>
                        <td className="px-4 py-3 text-right text-purple-600 dark:text-purple-400">
                          {formatCurrency(year.illustratedDeathBenefit - data.faceAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dividends Tab */}
        <TabsContent value="dividends" className="space-y-6">
          {data.policyType === 'Participating' && data.dividendInformation ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    Dividend Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Current Rate</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {data.dividendInformation.currentDividendRate.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Illustrated Rate</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {data.dividendInformation.illustratedRate.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Guaranteed Rate</p>
                      <p className="text-xl font-bold text-gray-600 dark:text-gray-400">
                        {data.dividendInformation.guaranteedRate.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Dividend Scale</p>
                      <p className="text-sm font-semibold mt-1">{data.dividendInformation.dividendScale}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        Dividends are not guaranteed and are based on the company's actual experience.
                        Historical performance does not guarantee future results. The illustrated dividends
                        assume the current dividend scale continues unchanged.
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dividend Projections</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Annual and Cumulative Dividends (Option: {data.dividendOption})
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={dividendChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="year"
                        label={{ value: 'Policy Year', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis
                        label={{ value: 'Dividends ($)', angle: -90, position: 'insideLeft' }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="dividends" fill="#3b82f6" name="Annual Dividend" />
                      <Line
                        type="monotone"
                        dataKey="cumulative"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Cumulative Dividends"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  This is a Non-Participating policy and does not pay dividends.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Loans Tab */}
        <TabsContent value="loans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Policy Loan Provisions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Maximum Loan Percentage</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {data.loanProvisions.maximumLoanPercentage}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">of available cash value</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Loan Interest Rate</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {data.loanProvisions.loanInterestRate.toFixed(2)}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{data.loanProvisions.loanType} rate</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Repayment Terms
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {data.loanProvisions.repaymentTerms}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Outstanding Loan Impact
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {data.loanProvisions.outstandingLoanImpact}
                  </p>
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <p className="text-sm text-orange-900 dark:text-orange-100 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Policy loans reduce the death benefit and cash value by the amount of the outstanding
                    loan plus accrued interest. If the total loan balance exceeds the cash value, the policy
                    may lapse.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Loan Value Projections */}
          <Card>
            <CardHeader>
              <CardTitle>Available Loan Values</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Maximum loan amount available each year ({data.loanProvisions.maximumLoanPercentage}% of cash value)
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Year</th>
                      <th className="px-4 py-3 text-left font-semibold">Age</th>
                      <th className="px-4 py-3 text-right font-semibold">Cash Value</th>
                      <th className="px-4 py-3 text-right font-semibold">Maximum Loan</th>
                      <th className="px-4 py-3 text-right font-semibold">Interest Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {data.projectionYears.filter((_, idx) => idx % 5 === 0 || idx < 10).map((year) => (
                      <tr key={year.year} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 font-medium">{year.year}</td>
                        <td className="px-4 py-3">{year.age}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(year.illustratedCashValue)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-600 dark:text-blue-400">
                          {formatCurrency(year.loanValue)}
                        </td>
                        <td className="px-4 py-3 text-right">{data.loanProvisions.loanInterestRate.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Riders Tab */}
        <TabsContent value="riders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Riders & Additional Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {data.riders.acceleratedDeathBenefit && (
                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Accelerated Death Benefit</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Provides advance payment of death benefit if diagnosed with a qualifying terminal illness
                      </p>
                    </div>
                  </div>
                )}

                {data.riders.waiveOfPremium && (
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Waiver of Premium</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Waives premiums if the insured becomes totally disabled before age 60
                      </p>
                    </div>
                  </div>
                )}

                {data.riders.guaranteedInsurability && (
                  <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Guaranteed Insurability Rider</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Purchase additional {formatCurrency(data.riders.guaranteedInsurability.coverage)} of coverage
                        without medical underwriting at ages: {data.riders.guaranteedInsurability.optionDates.join(', ')}
                      </p>
                      <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 mt-1">
                        Additional Premium: {formatCurrency(data.riders.guaranteedInsurability.premium)}/year
                      </p>
                    </div>
                  </div>
                )}

                {data.riders.accidentalDeath && (
                  <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Accidental Death Benefit</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Pays an additional {data.riders.accidentalDeath.multiplier}x the face amount if death
                        results from an accident
                      </p>
                      <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mt-1">
                        Additional Premium: {formatCurrency(data.riders.accidentalDeath.premium)}/year
                      </p>
                    </div>
                  </div>
                )}

                {data.riders.chronicIllness && (
                  <div className="flex items-start gap-3 p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-teal-600 dark:text-teal-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Chronic Illness Rider</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Provides access to up to {data.riders.chronicIllness.percentage}% of the death benefit
                        if diagnosed with a qualifying chronic illness
                      </p>
                      <p className="text-sm font-semibold text-teal-600 dark:text-teal-400 mt-1">
                        Additional Premium: {formatCurrency(data.riders.chronicIllness.premium)}/year
                      </p>
                    </div>
                  </div>
                )}

                {data.riders.termInsurance && (
                  <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Additional Term Insurance Rider</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Provides additional {formatCurrency(data.riders.termInsurance.coverage)} of term life coverage
                      </p>
                      <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                        Additional Premium: {formatCurrency(data.riders.termInsurance.premium)}/year
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Paid-Up Options */}
          {data.paidUpOptions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Non-Forfeiture Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Reduced Paid-Up Insurance</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Available at year {data.paidUpOptions.reducedPaidUp.availableAt}
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(data.paidUpOptions.reducedPaidUp.amount)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Reduced death benefit amount</p>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Extended Term Insurance</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Available at year {data.paidUpOptions.extendedTerm.availableAt}
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {data.paidUpOptions.extendedTerm.years} years, {data.paidUpOptions.extendedTerm.days} days
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Coverage period at full face amount</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Separator className="my-8 print:my-6" />

      {/* Disclaimers */}
      <Card className="bg-gray-50 dark:bg-gray-900 print:bg-white">
        <CardContent className="p-6 space-y-4 text-xs text-gray-600 dark:text-gray-400 print:text-gray-800">
          <p className="font-semibold text-gray-900 dark:text-gray-100 print:text-black">Important Disclosures:</p>

          <p>
            This illustration is not a contract and is not complete without all pages. It is intended for use in the
            state of {data.state} only. The policy illustrated is {data.productName} issued by {data.carrier}.
          </p>

          <p>
            The illustrated values assume that the currently illustrated non-guaranteed elements will continue unchanged
            for all years shown. This is not likely to occur, and actual results may be more or less favorable than those shown.
          </p>

          {data.policyType === 'Participating' && (
            <p>
              Dividends are not guaranteed. The dividend scale shown reflects the {data.carrier}'s current dividend scale
              and may be higher or lower in the future based on actual company experience.
            </p>
          )}

          <p>
            The assumed interest rate of {data.assumedInterestRate}% is used for illustration purposes only and is not
            guaranteed. Actual interest rates credited may be higher or lower.
          </p>

          <p>
            Policy loans will reduce the death benefit and cash surrender value. If total indebtedness exceeds the cash
            value, the policy will terminate unless additional premiums are paid.
          </p>

          <p>
            This illustration assumes premiums are paid as scheduled. Failure to pay premiums when due may cause the
            policy to lapse or require additional premium payments.
          </p>

          <p className="pt-4 border-t border-gray-300 dark:border-gray-700">
            Prepared by: {data.agentName || 'Licensed Agent'}
            {data.agentLicense && ` | License #${data.agentLicense}`}
          </p>

          <p>
            Carrier Rating: {data.carrierRating} | Illustration Number: {data.illustrationNumber}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
