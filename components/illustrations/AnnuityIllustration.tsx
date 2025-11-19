'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  Download,
  Mail,
  Printer,
  Building2,
  DollarSign,
  Calendar,
  Shield,
  AlertCircle,
} from 'lucide-react';

export interface AnnuityIllustrationData {
  // Product Information
  carrier: string;
  carrierRating: string;
  productName: string;
  annuityType: string;

  // Client Information
  clientName: string;
  clientAge: number;
  state: string;

  // Premium Information
  initialPremium: number;
  qualified: boolean;

  // Rate Information
  guaranteedRate: number;
  currentRate?: number;
  firstYearRate?: number;

  // Projection Data
  years: number;
  surrenderPeriod: number;
  projectionYears: {
    year: number;
    age: number;
    guaranteedValue: number;
    currentValue?: number;
    surrenderValue: number;
    surrenderCharge: number;
    surrenderChargePercentage: number;
    cumulativeInterest: number;
    deathBenefit: number;
  }[];

  // Features
  features: {
    deathBenefit?: boolean;
    nursingHomeBenefit?: boolean;
    terminalIllnessBenefit?: boolean;
    freeWithdrawal?: boolean;
    freeWithdrawalPercentage?: number;
    bailoutProvision?: boolean;
    marketValueAdjustment?: boolean;
  };

  // Additional Options
  riderOptions?: string[];
  indexingStrategies?: string[];

  // Metadata
  illustrationDate: string;
  illustrationNumber: string;
}

interface AnnuityIllustrationProps {
  data: AnnuityIllustrationData;
}

export function AnnuityIllustration({ data }: AnnuityIllustrationProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatRate = (rate: number) => {
    return `${rate.toFixed(2)}%`;
  };

  const getRatingColor = (rating: string) => {
    const ratingMap: Record<string, string> = {
      'A++': 'bg-green-100 text-green-800',
      'A+': 'bg-green-100 text-green-800',
      'A': 'bg-blue-100 text-blue-800',
      'A-': 'bg-blue-100 text-blue-800',
      'B++': 'bg-yellow-100 text-yellow-800',
      'B+': 'bg-yellow-100 text-yellow-800',
    };
    return ratingMap[rating] || 'bg-gray-100 text-gray-800';
  };

  const chartData = data.projectionYears.map((year) => ({
    year: year.year,
    age: year.age,
    'Guaranteed Value': year.guaranteedValue,
    'Current Value': year.currentValue || year.guaranteedValue,
    'Surrender Value': year.surrenderValue,
  }));

  const totalReturn = data.projectionYears[data.projectionYears.length - 1];
  const totalGain = totalReturn.guaranteedValue - data.initialPremium;
  const totalGainPercentage = (totalGain / data.initialPremium) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-muted-foreground" />
                <CardTitle className="text-2xl">{data.carrier}</CardTitle>
                <Badge className={getRatingColor(data.carrierRating)}>
                  {data.carrierRating}
                </Badge>
              </div>
              <CardDescription className="text-lg">
                {data.productName}
              </CardDescription>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{data.annuityType}</Badge>
                <Badge variant="outline">
                  {data.qualified ? 'Qualified (IRA)' : 'Non-Qualified'}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Client</div>
              <div className="font-semibold">{data.clientName}</div>
              <div className="text-sm text-muted-foreground">Age {data.clientAge}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Initial Premium</div>
              <div className="text-xl font-bold text-primary">
                {formatCurrency(data.initialPremium)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Guaranteed Rate</div>
              <div className="text-xl font-bold text-green-600">
                {formatRate(data.guaranteedRate)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Illustration Date</div>
              <div className="font-medium">{data.illustrationDate}</div>
              <div className="text-xs text-muted-foreground">#{data.illustrationNumber}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Value at Maturity</CardDescription>
            <CardTitle className="text-3xl text-primary">
              {formatCurrency(totalReturn.guaranteedValue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              After {data.years} years (Age {totalReturn.age})
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Interest Earned</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {formatCurrency(totalGain)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {formatRate(totalGainPercentage)} return
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Surrender Period</CardDescription>
            <CardTitle className="text-3xl">
              {data.surrenderPeriod} Years
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {data.features.freeWithdrawal && (
                <span>
                  {data.features.freeWithdrawalPercentage}% free withdrawal annually
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projections">Year-by-Year</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="disclosures">Disclosures</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Value Projection</CardTitle>
              <CardDescription>
                Guaranteed vs. current illustrated values over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" label={{ value: 'Policy Year', position: 'insideBottom', offset: -5 }} />
                  <YAxis
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    label={{ value: 'Account Value', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Year ${label}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="Guaranteed Value"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                  />
                  {data.currentRate && (
                    <Area
                      type="monotone"
                      dataKey="Current Value"
                      stackId="2"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="Surrender Value"
                    stackId="3"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.projectionYears
                  .filter((y) => y.year === 1 || y.year === 5 || y.year === 10 || y.year === data.surrenderPeriod || y.year === data.years)
                  .map((year) => (
                    <div key={year.year} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-semibold">Year {year.year} (Age {year.age})</div>
                        <div className="text-sm text-muted-foreground">
                          {year.surrenderCharge > 0 && (
                            <span className="text-orange-600">
                              Surrender charge: {formatRate(year.surrenderChargePercentage)}
                            </span>
                          )}
                          {year.surrenderCharge === 0 && year.year === data.surrenderPeriod && (
                            <span className="text-green-600">Surrender period ends</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">
                          {formatCurrency(year.guaranteedValue)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Surrender: {formatCurrency(year.surrenderValue)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Year-by-Year Projections Tab */}
        <TabsContent value="projections">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Year-by-Year Projections</CardTitle>
              <CardDescription>
                Account values, surrender charges, and death benefits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead className="text-right">Guaranteed Value</TableHead>
                      {data.currentRate && (
                        <TableHead className="text-right">Current Value</TableHead>
                      )}
                      <TableHead className="text-right">Surrender Value</TableHead>
                      <TableHead className="text-right">Surrender Charge</TableHead>
                      <TableHead className="text-right">Death Benefit</TableHead>
                      <TableHead className="text-right">Cumulative Interest</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.projectionYears.map((year) => (
                      <TableRow key={year.year}>
                        <TableCell className="font-medium">{year.year}</TableCell>
                        <TableCell>{year.age}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {formatCurrency(year.guaranteedValue)}
                        </TableCell>
                        {data.currentRate && (
                          <TableCell className="text-right font-semibold text-blue-600">
                            {formatCurrency(year.currentValue || year.guaranteedValue)}
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          {formatCurrency(year.surrenderValue)}
                        </TableCell>
                        <TableCell className="text-right">
                          {year.surrenderCharge > 0 ? (
                            <span className="text-orange-600">
                              {formatCurrency(year.surrenderCharge)} ({formatRate(year.surrenderChargePercentage)})
                            </span>
                          ) : (
                            <span className="text-green-600">$0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(year.deathBenefit)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(year.cumulativeInterest)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Features</CardTitle>
              <CardDescription>Benefits and optional riders included</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.features.deathBenefit && (
                  <div className="flex items-start gap-3 p-4 border rounded-lg">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-semibold">Death Benefit</div>
                      <div className="text-sm text-muted-foreground">
                        Beneficiaries receive account value or premium, whichever is greater
                      </div>
                    </div>
                  </div>
                )}

                {data.features.nursingHomeBenefit && (
                  <div className="flex items-start gap-3 p-4 border rounded-lg">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-semibold">Nursing Home Waiver</div>
                      <div className="text-sm text-muted-foreground">
                        Surrender charges waived for nursing home confinement
                      </div>
                    </div>
                  </div>
                )}

                {data.features.terminalIllnessBenefit && (
                  <div className="flex items-start gap-3 p-4 border rounded-lg">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-semibold">Terminal Illness Waiver</div>
                      <div className="text-sm text-muted-foreground">
                        Surrender charges waived for terminal diagnosis
                      </div>
                    </div>
                  </div>
                )}

                {data.features.freeWithdrawal && (
                  <div className="flex items-start gap-3 p-4 border rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-semibold">Free Withdrawal</div>
                      <div className="text-sm text-muted-foreground">
                        Withdraw up to {data.features.freeWithdrawalPercentage}% annually without surrender charges
                      </div>
                    </div>
                  </div>
                )}

                {data.features.bailoutProvision && (
                  <div className="flex items-start gap-3 p-4 border rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-semibold">Bailout Provision</div>
                      <div className="text-sm text-muted-foreground">
                        Withdraw without penalty if renewal rate drops significantly
                      </div>
                    </div>
                  </div>
                )}

                {data.features.marketValueAdjustment && (
                  <div className="flex items-start gap-3 p-4 border rounded-lg">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <div className="font-semibold">Market Value Adjustment (MVA)</div>
                      <div className="text-sm text-muted-foreground">
                        Early withdrawal subject to interest rate adjustment
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {data.riderOptions && data.riderOptions.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Available Riders (Optional)</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.riderOptions.map((rider, index) => (
                      <Badge key={index} variant="outline">
                        {rider}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {data.indexingStrategies && data.indexingStrategies.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Indexing Strategies</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {data.indexingStrategies.map((strategy, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 border rounded-md">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{strategy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Disclosures Tab */}
        <TabsContent value="disclosures">
          <Card>
            <CardHeader>
              <CardTitle>Important Disclosures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">This is a hypothetical illustration</p>
                    <p>
                      The values shown are based on current rates and assumptions. Actual values may differ.
                      This illustration is not a contract and does not guarantee future performance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm text-muted-foreground">
                <h4 className="font-semibold text-foreground">General Information</h4>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    Annuities are long-term investments designed for retirement planning. Early withdrawals may be
                    subject to surrender charges and tax penalties.
                  </li>
                  <li>
                    Guaranteed values are backed by the financial strength and claims-paying ability of {data.carrier}.
                  </li>
                  <li>
                    Current illustrated values assume continuation of current interest rates, which are not guaranteed
                    and may change.
                  </li>
                  <li>
                    Withdrawals from non-qualified annuities are taxed as ordinary income to the extent of gain.
                    Withdrawals before age 59½ may be subject to a 10% federal tax penalty.
                  </li>
                  <li>
                    This product is not FDIC insured, not bank guaranteed, and may lose value.
                  </li>
                </ul>

                <h4 className="font-semibold text-foreground mt-6">Surrender Charges</h4>
                <p>
                  Withdrawals exceeding the free withdrawal amount during the surrender period will be subject to
                  surrender charges. The surrender charge schedule is shown in the year-by-year projections.
                </p>

                {data.features.marketValueAdjustment && (
                  <>
                    <h4 className="font-semibold text-foreground mt-6">Market Value Adjustment</h4>
                    <p>
                      This product includes a Market Value Adjustment (MVA) feature. If you withdraw funds during the
                      surrender period, an MVA will be applied based on changes in interest rates. The MVA may be
                      positive or negative and could reduce your account value.
                    </p>
                  </>
                )}

                <h4 className="font-semibold text-foreground mt-6">State Availability</h4>
                <p>
                  This illustration is prepared for a client in {data.state}. Product features, rates, and
                  availability may vary by state.
                </p>

                <div className="pt-4 mt-4 border-t">
                  <p className="text-xs">
                    Illustration Number: {data.illustrationNumber}<br />
                    Date Prepared: {data.illustrationDate}<br />
                    This illustration is valid for 30 days from the date of preparation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
