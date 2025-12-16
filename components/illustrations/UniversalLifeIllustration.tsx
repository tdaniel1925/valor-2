"use client";

import { Card, CardContent, CardHeader, CardTitle, Badge, Separator } from "@/components/ui";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CheckCircle, DollarSign, TrendingUp, Shield, AlertTriangle, Zap, Settings, CreditCard } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface UniversalLifeIllustrationData {
  // Product Information
  carrier: string;
  carrierRating: string;
  productName: string;
  policyType: 'Indexed' | 'Variable' | 'Fixed' | 'Guaranteed';
  deathBenefitOption: 'Level' | 'Increasing' | 'Return of Premium';

  // Client Information
  clientName: string;
  clientAge: number;
  gender: 'Male' | 'Female';
  smoker: boolean;
  healthClass: 'Preferred Plus' | 'Preferred' | 'Standard Plus' | 'Standard';
  state: string;

  // Coverage Information
  specifiedAmount: number;
  initialDeathBenefit: number;
  plannedPremium: number;
  minimumPremium: number;
  maximumPremium: number;
  targetPremium: number;

  // Interest Crediting Strategy
  creditingStrategy: {
    type: 'Fixed' | 'Indexed' | 'Variable';
    currentRate: number;
    guaranteedMinimum: number;
    illustratedRate: number;
    cappedRate?: number;
    participationRate?: number;
    indexName?: string;
  };

  // Cost of Insurance
  costOfInsurance: {
    currentCOI: number;
    guaranteedMaximumCOI: number;
    mortalityCharges: string;
    monthlyDeductions: {
      basePolicy: number;
      riders: number;
      administrative: number;
    };
  };

  // Projections (3 scenarios)
  projections: {
    illustrated: ProjectionYear[];
    guaranteed: ProjectionYear[];
    midpoint?: ProjectionYear[];
  };

  // Premium Flexibility Scenarios
  premiumScenarios: {
    name: string;
    description: string;
    annualPremium: number;
    yearsOfPayment: number;
    totalPremiumsPaid: number;
    cashValueAt20: number;
    lapseYear?: number;
  }[];

  // Riders & Benefits
  riders: {
    acceleratedDeathBenefit?: boolean;
    waiveOfPremium?: { premium: number };
    chronicIllness?: { percentage: number; premium: number };
    noLapseguarantee?: { period: number; requiresMinimumPremium: number };
    overloanProtection?: boolean;
    termInsurance?: { coverage: number; premium: number };
  };

  // Loan Provisions
  loanProvisions: {
    maximumLoanPercentage: number;
    loanInterestRate: number;
    loanType: 'Fixed' | 'Variable' | 'Wash';
    washLoanRate?: number;
  };

  // Surrender Charges
  surrenderCharges: {
    schedule: { year: number; percentage: number }[];
    duration: number;
  };

  // Performance Metrics
  metrics: {
    internalRateOfReturn: {
      year10: number;
      year20: number;
      lifeExpectancy: number;
    };
    solveForPremium: {
      toAge100: number;
      toAge121: number;
    };
    lapseTestYear?: number;
  };

  // Metadata
  illustrationDate: string;
  illustrationNumber: string;
  agentName?: string;
  agentLicense?: string;
}

interface ProjectionYear {
  year: number;
  age: number;
  annualPremium: number;
  cumulativePremium: number;
  cashValue: number;
  deathBenefit: number;
  surrenderValue: number;
  costOfInsurance: number;
  interestCredited: number;
  endOfYearLoanValue: number;
}

interface UniversalLifeIllustrationProps {
  data: UniversalLifeIllustrationData;
}

export function UniversalLifeIllustration({ data }: UniversalLifeIllustrationProps) {
  // Prepare chart data
  const cashValueChartData = data.projections.illustrated.map((year, idx) => ({
    year: year.year,
    age: year.age,
    illustrated: year.cashValue,
    guaranteed: data.projections.guaranteed[idx]?.cashValue || 0,
    midpoint: data.projections.midpoint?.[idx]?.cashValue || null,
    premium: year.cumulativePremium,
  }));

  const deathBenefitChartData = data.projections.illustrated.map((year, idx) => ({
    year: year.year,
    illustrated: year.deathBenefit,
    guaranteed: data.projections.guaranteed[idx]?.deathBenefit || 0,
  }));

  const costAnalysisChartData = data.projections.illustrated
    .filter((_, idx) => idx < 30)
    .map(year => ({
      year: year.year,
      interest: year.interestCredited,
      coi: year.costOfInsurance,
    }));

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6 print:p-4">
      {/* Header */}
      <div className="flex items-center justify-between print:mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 print:text-black">
            Universal Life Insurance Illustration
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
              <span className="font-semibold text-sm">{data.productName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Type:</span>
              <Badge variant="secondary">{data.policyType} UL</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Death Benefit Option:</span>
              <Badge variant="outline">{data.deathBenefitOption}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Specified Amount:</span>
              <span className="font-semibold text-lg">{formatCurrency(data.specifiedAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Initial Death Benefit:</span>
              <span className="font-semibold text-lg">{formatCurrency(data.initialDeathBenefit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Planned Premium:</span>
              <span className="font-semibold">{formatCurrency(data.plannedPremium)}/year</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Minimum:</span>
              <span>{formatCurrency(data.minimumPremium)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Maximum:</span>
              <span>{formatCurrency(data.maximumPremium)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interest Crediting & Cost Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Interest Crediting Strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Strategy Type:</span>
              <Badge variant="secondary">{data.creditingStrategy.type}</Badge>
            </div>
            {data.creditingStrategy.indexName && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Index:</span>
                <span className="font-semibold text-sm">{data.creditingStrategy.indexName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Current Rate:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {data.creditingStrategy.currentRate.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Illustrated Rate:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {data.creditingStrategy.illustratedRate.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Guaranteed Minimum:</span>
              <span className="font-semibold">{data.creditingStrategy.guaranteedMinimum.toFixed(2)}%</span>
            </div>
            {data.creditingStrategy.cappedRate && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Cap Rate:</span>
                <span className="font-semibold">{data.creditingStrategy.cappedRate.toFixed(2)}%</span>
              </div>
            )}
            {data.creditingStrategy.participationRate && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Participation Rate:</span>
                <span className="font-semibold">{data.creditingStrategy.participationRate.toFixed(0)}%</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Cost of Insurance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Current COI Rate:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                ${data.costOfInsurance.currentCOI.toFixed(2)}/mo
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Guaranteed Max COI:</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                ${data.costOfInsurance.guaranteedMaximumCOI.toFixed(2)}/mo
              </span>
            </div>
            <Separator />
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Monthly Deductions:</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Base Policy:</span>
              <span>{formatCurrency(data.costOfInsurance.monthlyDeductions.basePolicy)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Riders:</span>
              <span>{formatCurrency(data.costOfInsurance.monthlyDeductions.riders)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Administrative:</span>
              <span>{formatCurrency(data.costOfInsurance.monthlyDeductions.administrative)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>Total Monthly:</span>
              <span>
                {formatCurrency(
                  data.costOfInsurance.monthlyDeductions.basePolicy +
                  data.costOfInsurance.monthlyDeductions.riders +
                  data.costOfInsurance.monthlyDeductions.administrative
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Performance Metrics */}
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
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">IRR @ Year 20</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {data.metrics.internalRateOfReturn.year20.toFixed(2)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Premium to Age 100</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(data.metrics.solveForPremium.toAge100)}/yr
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">CV @ Age {data.clientAge + 20}</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(data.projections.illustrated[19]?.cashValue || 0)}
              </p>
            </div>
            {data.metrics.lapseTestYear ? (
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Lapse Test Year</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {data.metrics.lapseTestYear}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Premium to Age 121</p>
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(data.metrics.solveForPremium.toAge121)}/yr
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator className="print:hidden" />

      {/* Tabbed Content */}
      <Tabs defaultValue="cash-value" className="w-full">
        <TabsList className="grid w-full grid-cols-5 print:hidden">
          <TabsTrigger value="cash-value">Cash Value</TabsTrigger>
          <TabsTrigger value="scenarios">Premium Scenarios</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="riders">Riders</TabsTrigger>
        </TabsList>

        {/* Cash Value Projections Tab */}
        <TabsContent value="cash-value" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cash Value Projections</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Illustrated at {data.creditingStrategy.illustratedRate.toFixed(2)}% vs Guaranteed at {data.creditingStrategy.guaranteedMinimum.toFixed(2)}%
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={cashValueChartData}>
                  <defs>
                    <linearGradient id="illustratedCVUL" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="guaranteedCVUL" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#illustratedCVUL)"
                    name="Illustrated Cash Value"
                  />
                  <Area
                    type="monotone"
                    dataKey="guaranteed"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#guaranteedCVUL)"
                    name="Guaranteed Cash Value"
                  />
                  {data.projections.midpoint && (
                    <Line
                      type="monotone"
                      dataKey="midpoint"
                      stroke="#a855f7"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Midpoint Scenario"
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="premium"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    name="Cumulative Premium"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Death Benefit Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Death Benefit Projections</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Death Benefit Option: {data.deathBenefitOption}
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
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

          {/* Detailed Projection Table */}
          <Card>
            <CardHeader>
              <CardTitle>Year-by-Year Illustrated Projections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Year</th>
                      <th className="px-4 py-3 text-left font-semibold">Age</th>
                      <th className="px-4 py-3 text-right font-semibold">Premium</th>
                      <th className="px-4 py-3 text-right font-semibold">Cash Value</th>
                      <th className="px-4 py-3 text-right font-semibold">Death Benefit</th>
                      <th className="px-4 py-3 text-right font-semibold">COI</th>
                      <th className="px-4 py-3 text-right font-semibold">Interest</th>
                      <th className="px-4 py-3 text-right font-semibold">Surrender Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {data.projections.illustrated.map((year) => (
                      <tr key={year.year} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 font-medium">{year.year}</td>
                        <td className="px-4 py-3">{year.age}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(year.annualPremium)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-600 dark:text-blue-400">
                          {formatCurrency(year.cashValue)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatCurrency(year.deathBenefit)}
                        </td>
                        <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">
                          {formatCurrency(year.costOfInsurance)}
                        </td>
                        <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                          {formatCurrency(year.interestCredited)}
                        </td>
                        <td className="px-4 py-3 text-right">{formatCurrency(year.surrenderValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Premium Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Premium Flexibility Scenarios</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Compare different premium payment strategies and their impact on policy performance
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {data.premiumScenarios.map((scenario, idx) => (
                  <div
                    key={idx}
                    className="p-5 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                          {scenario.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {scenario.description}
                        </p>
                      </div>
                      {scenario.lapseYear && (
                        <Badge variant="destructive" className="ml-4">
                          Lapses Year {scenario.lapseYear}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Annual Premium</p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(scenario.annualPremium)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Years of Payment</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {scenario.yearsOfPayment}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Premiums</p>
                        <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                          {formatCurrency(scenario.totalPremiumsPaid)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">CV @ Year 20</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(scenario.cashValueAt20)}
                        </p>
                      </div>
                    </div>

                    {scenario.lapseYear && (
                      <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-sm text-red-900 dark:text-red-100 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Policy may lapse in year {scenario.lapseYear} if premiums are not increased
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Premium Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Minimum Premium</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {formatCurrency(data.minimumPremium)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Required to keep policy in force
                  </p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Target Premium</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(data.targetPremium)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Recommended for illustrated performance
                  </p>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Maximum Premium</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(data.maximumPremium)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    MEC limit - do not exceed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Analysis Tab */}
        <TabsContent value="costs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Interest Credited vs Cost of Insurance</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                First 30 years of policy performance
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={costAnalysisChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="year"
                    label={{ value: 'Policy Year', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="interest" fill="#10b981" name="Interest Credited" />
                  <Bar dataKey="coi" fill="#ef4444" name="Cost of Insurance" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Surrender Charges */}
          <Card>
            <CardHeader>
              <CardTitle>Surrender Charge Schedule</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Surrender charges apply for {data.surrenderCharges.duration} years
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                {data.surrenderCharges.schedule.map((item) => (
                  <div key={item.year} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Year {item.year}</p>
                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {item.percentage}%
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Surrender charges are deducted from the cash value if the policy is surrendered during
                    the first {data.surrenderCharges.duration} years. After year {data.surrenderCharges.duration},
                    surrender value equals cash value.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Maximum Loan %</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {data.loanProvisions.maximumLoanPercentage}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Loan Interest Rate</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {data.loanProvisions.loanInterestRate.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Loan Type</p>
                  <Badge variant="outline" className="text-lg mt-1">
                    {data.loanProvisions.loanType}
                  </Badge>
                </div>
              </div>

              {data.loanProvisions.loanType === 'Wash' && data.loanProvisions.washLoanRate && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                    Wash Loan Feature
                  </p>
                  <p className="text-sm text-green-900 dark:text-green-100">
                    Borrowed funds continue to earn {data.loanProvisions.washLoanRate.toFixed(2)}% interest,
                    offsetting the {data.loanProvisions.loanInterestRate.toFixed(2)}% loan charge. This results
                    in a net zero cost for policy loans.
                  </p>
                </div>
              )}

              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <p className="text-sm text-orange-900 dark:text-orange-100 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Outstanding policy loans reduce the death benefit and cash value. If the loan balance
                    plus interest exceeds the cash value, the policy will lapse unless additional premiums
                    are paid.
                  </span>
                </p>
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
                        Access death benefit if diagnosed with a qualifying terminal illness
                      </p>
                    </div>
                  </div>
                )}

                {data.riders.waiveOfPremium && (
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="flex justify-between items-start w-full">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">Waiver of Premium</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Waives monthly deductions if totally disabled before age 60
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {formatCurrency(data.riders.waiveOfPremium.premium)}/year
                      </p>
                    </div>
                  </div>
                )}

                {data.riders.chronicIllness && (
                  <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                    <div className="flex justify-between items-start w-full">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">Chronic Illness Rider</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Access up to {data.riders.chronicIllness.percentage}% of death benefit for chronic illness
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                        {formatCurrency(data.riders.chronicIllness.premium)}/year
                      </p>
                    </div>
                  </div>
                )}

                {data.riders.noLapseguarantee && (
                  <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">No-Lapse Guarantee</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Guarantees policy will not lapse for {data.riders.noLapseguarantee.period} years if
                        minimum premium of {formatCurrency(data.riders.noLapseguarantee.requiresMinimumPremium)}/year
                        is paid
                      </p>
                    </div>
                  </div>
                )}

                {data.riders.overloanProtection && (
                  <div className="flex items-start gap-3 p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-teal-600 dark:text-teal-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Overloan Protection</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Prevents policy lapse due to excessive loans under certain conditions
                      </p>
                    </div>
                  </div>
                )}

                {data.riders.termInsurance && (
                  <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div className="flex justify-between items-start w-full">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">Term Insurance Rider</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Additional {formatCurrency(data.riders.termInsurance.coverage)} term coverage
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                        {formatCurrency(data.riders.termInsurance.premium)}/year
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
            This is a {data.policyType} Universal Life insurance policy. The illustrated values shown are based on
            the current {data.creditingStrategy.type.toLowerCase()} crediting rate of {data.creditingStrategy.currentRate.toFixed(2)}%
            and assume an illustrated rate of {data.creditingStrategy.illustratedRate.toFixed(2)}%. These rates are not
            guaranteed and may be higher or lower in the future.
          </p>

          <p>
            The guaranteed values assume the guaranteed minimum interest rate of {data.creditingStrategy.guaranteedMinimum.toFixed(2)}%
            and guaranteed maximum cost of insurance charges. Actual results will vary based on actual interest rates
            credited and actual cost of insurance charges.
          </p>

          <p>
            Premium payments are flexible within the minimum and maximum premium guidelines. Paying less than the
            target premium may cause the policy to lapse earlier than illustrated. Paying more than the maximum
            premium (MEC limit) may cause the policy to become a Modified Endowment Contract with adverse tax consequences.
          </p>

          <p>
            Surrender charges of up to {Math.max(...data.surrenderCharges.schedule.map(s => s.percentage))}% apply
            during the first {data.surrenderCharges.duration} years. Policy loans reduce the death benefit and cash
            value and may cause the policy to lapse if not managed properly.
          </p>

          <p>
            Cost of insurance charges increase with age and may cause the policy to require additional premiums in
            later years to prevent lapse. This illustration assumes premiums are paid as scheduled. Changes to premium
            payments will impact policy performance.
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
