'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Shield, TrendingUp, Download, Mail, Printer, Calendar, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

export interface TermLifeIllustrationData {
  // Product Information
  carrier: string;
  carrierRating: string;
  productName: string;
  policyType: 'Level Term' | 'Decreasing Term' | 'Increasing Term' | 'Return of Premium';

  // Client Information
  clientName: string;
  clientAge: number;
  gender: 'Male' | 'Female';
  smoker: boolean;
  healthClass: 'Preferred Plus' | 'Preferred' | 'Standard Plus' | 'Standard';
  state: string;

  // Coverage Information
  coverageAmount: number;
  term: number; // in years
  annualPremium: number;
  monthlyPremium: number;
  totalPremiumOverTerm: number;

  // Projections
  projectionYears: {
    year: number;
    age: number;
    premium: number;
    deathBenefit: number;
    cumulativePremium: number;
    returnOfPremiumValue?: number; // if ROP rider
  }[];

  // Riders & Benefits
  riders: {
    acceleratedDeathBenefit?: boolean;
    waiveOfPremium?: boolean;
    childTerm?: { coverage: number; premium: number };
    accidentalDeath?: { multiplier: number; premium: number };
    returnOfPremium?: { premium: number };
    conversion?: { available: boolean; deadline: number };
  };

  // Renewal Information (if applicable)
  renewalOption?: boolean;
  renewalProjections?: {
    age: number;
    annualPremium: number;
  }[];

  // Conversion Information
  conversionOptions?: {
    productName: string;
    type: string;
    deadlineAge: number;
  }[];

  // Metadata
  illustrationDate: string;
  illustrationNumber: string;
  agentName?: string;
  agentLicense?: string;
}

interface TermLifeIllustrationProps {
  data: TermLifeIllustrationData;
}

export function TermLifeIllustration({ data }: TermLifeIllustrationProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const costPerThousand = (data.annualPremium / (data.coverageAmount / 1000)).toFixed(2);
  const costPerDay = (data.annualPremium / 365).toFixed(2);

  // Chart data for premium vs coverage
  const coverageChartData = data.projectionYears.map(year => ({
    year: year.year,
    premium: year.cumulativePremium,
    coverage: year.deathBenefit / 1000, // in thousands for better chart display
  }));

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="print:p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-2xl">{data.productName}</CardTitle>
              </div>
              <CardDescription className="text-base">
                {data.term}-Year {data.policyType} Life Insurance Illustration
              </CardDescription>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="outline">{data.carrier}</Badge>
                <Badge>{data.carrierRating} Rated</Badge>
              </div>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Client & Policy Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Insured Information</CardTitle>
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
              <span className="text-gray-600 dark:text-gray-400">Tobacco Use:</span>
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
            <CardTitle className="text-lg">Coverage Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Death Benefit:</span>
              <span className="font-bold text-xl text-blue-600">{formatCurrency(data.coverageAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Term Length:</span>
              <span className="font-semibold">{data.term} Years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Annual Premium:</span>
              <span className="font-semibold">{formatCurrency(data.annualPremium)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Monthly Premium:</span>
              <span className="font-semibold">{formatCurrency(data.monthlyPremium)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Cost per $1,000:</span>
              <span>${costPerThousand}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Cost per Day:</span>
              <span>${costPerDay}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Highlights */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(data.totalPremiumOverTerm)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Premium Over {data.term} Years</div>
            </div>
            <div className="text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{formatCurrency(data.coverageAmount)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Guaranteed Death Benefit</div>
            </div>
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">
                {((data.coverageAmount / data.totalPremiumOverTerm) * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Coverage to Premium Ratio</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="projection" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projection">Coverage Projection</TabsTrigger>
          <TabsTrigger value="riders">Riders & Benefits</TabsTrigger>
          <TabsTrigger value="conversion">Conversion Options</TabsTrigger>
          {data.renewalOption && <TabsTrigger value="renewal">Renewal</TabsTrigger>}
        </TabsList>

        {/* Coverage Projection Tab */}
        <TabsContent value="projection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coverage Projection Chart</CardTitle>
              <CardDescription>Death benefit coverage vs cumulative premium over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={coverageChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" label={{ value: 'Policy Year', position: 'insideBottom', offset: -5 }} />
                  <YAxis yAxisId="left" label={{ value: 'Death Benefit ($1000s)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Cumulative Premium ($)', angle: 90, position: 'insideRight' }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="coverage" stroke="#3b82f6" strokeWidth={3} name="Death Benefit ($1000s)" />
                  <Line yAxisId="right" type="monotone" dataKey="premium" stroke="#10b981" strokeWidth={2} name="Cumulative Premium" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Year-by-Year Projection</CardTitle>
              <CardDescription>Detailed premium and benefit breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead className="text-right">Annual Premium</TableHead>
                      <TableHead className="text-right">Cumulative Premium</TableHead>
                      <TableHead className="text-right">Death Benefit</TableHead>
                      {data.riders.returnOfPremium && <TableHead className="text-right">ROP Value</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.projectionYears.map((year) => (
                      <TableRow key={year.year}>
                        <TableCell className="font-medium">{year.year}</TableCell>
                        <TableCell>{year.age}</TableCell>
                        <TableCell className="text-right">{formatCurrency(year.premium)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(year.cumulativePremium)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(year.deathBenefit)}</TableCell>
                        {data.riders.returnOfPremium && (
                          <TableCell className="text-right">{formatCurrency(year.returnOfPremiumValue || 0)}</TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Riders & Benefits Tab */}
        <TabsContent value="riders">
          <Card>
            <CardHeader>
              <CardTitle>Included Benefits & Optional Riders</CardTitle>
              <CardDescription>Additional coverage and features available with this policy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.riders.acceleratedDeathBenefit && (
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold">Accelerated Death Benefit</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Access up to 50% of death benefit if diagnosed with terminal illness (12 months or less to live).
                      Included at no additional cost.
                    </p>
                  </div>
                </div>
              )}

              {data.riders.waiveOfPremium && (
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold">Waiver of Premium</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Premiums waived if you become totally disabled for 6 months or more. Coverage continues without payment required.
                    </p>
                  </div>
                </div>
              )}

              {data.riders.accidentalDeath && (
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Accidental Death Benefit</h4>
                      <Badge>+{formatCurrency(data.riders.accidentalDeath.premium)}/year</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Additional {data.riders.accidentalDeath.multiplier}x death benefit ({formatCurrency(data.coverageAmount * data.riders.accidentalDeath.multiplier)}) if death results from accident.
                    </p>
                  </div>
                </div>
              )}

              {data.riders.childTerm && (
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Child Term Rider</h4>
                      <Badge>+{formatCurrency(data.riders.childTerm.premium)}/year</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {formatCurrency(data.riders.childTerm.coverage)} coverage for all eligible children. Conversion option at age 25 without evidence of insurability.
                    </p>
                  </div>
                </div>
              )}

              {data.riders.returnOfPremium && (
                <div className="flex items-start gap-3 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <TrendingUp className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Return of Premium</h4>
                      <Badge>+{formatCurrency(data.riders.returnOfPremium.premium)}/year</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      All premiums paid will be returned if you outlive the term. Total return: {formatCurrency((data.annualPremium + data.riders.returnOfPremium.premium) * data.term)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversion Options Tab */}
        <TabsContent value="conversion">
          <Card>
            <CardHeader>
              <CardTitle>Policy Conversion Options</CardTitle>
              <CardDescription>Convert to permanent life insurance without medical underwriting</CardDescription>
            </CardHeader>
            <CardContent>
              {data.riders.conversion?.available ? (
                <>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-green-900 dark:text-green-100">Conversion Privilege Available</h4>
                        <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                          You can convert this term policy to a permanent life insurance policy until age {data.riders.conversion.deadline} without providing evidence of insurability.
                        </p>
                      </div>
                    </div>
                  </div>

                  {data.conversionOptions && data.conversionOptions.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold">Available Conversion Products:</h4>
                      {data.conversionOptions.map((option, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold">{option.productName}</h5>
                            <Badge variant="outline">{option.type}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Convert by age {option.deadlineAge} • No medical exam required • Same carrier rating
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border rounded-lg text-center">
                  <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">Conversion option not available with this policy</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Renewal Tab */}
        {data.renewalOption && data.renewalProjections && (
          <TabsContent value="renewal">
            <Card>
              <CardHeader>
                <CardTitle>Renewal Premium Projections</CardTitle>
                <CardDescription>Estimated premiums if policy is renewed after initial term</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">Important Notice</h4>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                        Renewal premiums increase significantly with age. Consider converting to permanent coverage or purchasing a new term policy with medical underwriting for better rates.
                      </p>
                    </div>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Age at Renewal</TableHead>
                      <TableHead className="text-right">Annual Premium</TableHead>
                      <TableHead className="text-right">Increase from Original</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.renewalProjections.map((renewal) => (
                      <TableRow key={renewal.age}>
                        <TableCell className="font-medium">{renewal.age}</TableCell>
                        <TableCell className="text-right">{formatCurrency(renewal.annualPremium)}</TableCell>
                        <TableCell className="text-right text-red-600">
                          +{((renewal.annualPremium / data.annualPremium - 1) * 100).toFixed(0)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Footer Disclaimers */}
      <Card className="print:break-before-page">
        <CardHeader>
          <CardTitle className="text-lg">Important Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <strong>Illustration Number:</strong> {data.illustrationNumber} • <strong>Date:</strong> {new Date(data.illustrationDate).toLocaleDateString()}
          </p>
          <p>
            This illustration is based on current rates and policy values, which are not guaranteed and subject to change.
            Premiums shown assume {data.healthClass} health classification and {data.smoker ? '' : 'non-'}smoker rates.
          </p>
          <p>
            This is a hypothetical illustration only and is not a contract. Actual results may vary. All guarantees are based on the financial strength and claims-paying ability of {data.carrier}.
          </p>
          <p>
            Life insurance policies contain exclusions, limitations, and terms for keeping them in force. Your licensed agent can provide complete details.
          </p>
          {data.agentName && (
            <p className="pt-3 border-t">
              <strong>Prepared by:</strong> {data.agentName} {data.agentLicense && `• License: ${data.agentLicense}`}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
