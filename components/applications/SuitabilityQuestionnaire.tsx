'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import type { FireLightSuitability } from '@/lib/integrations/firelight/types';

interface SuitabilityQuestionnaireProps {
  onComplete: (suitability: FireLightSuitability) => void;
  onBack?: () => void;
  initialData?: Partial<FireLightSuitability>;
}

const SECTIONS = [
  { id: 1, title: 'Investment Goals' },
  { id: 2, title: 'Financial Situation' },
  { id: 3, title: 'Risk & Time Horizon' },
  { id: 4, title: 'Understanding & Acknowledgment' },
];

export function SuitabilityQuestionnaire({
  onComplete,
  onBack,
  initialData,
}: SuitabilityQuestionnaireProps) {
  const [currentSection, setCurrentSection] = useState(1);
  const [formData, setFormData] = useState<Partial<FireLightSuitability>>({
    investmentObjective: initialData?.investmentObjective,
    investmentTimeHorizon: initialData?.investmentTimeHorizon,
    riskTolerance: initialData?.riskTolerance,
    liquidityNeeds: initialData?.liquidityNeeds,
    emergencyFunds: initialData?.emergencyFunds,
    otherInvestments: initialData?.otherInvestments,
    existingAnnuities: initialData?.existingAnnuities || [],
    purposeOfAnnuity: initialData?.purposeOfAnnuity || '',
    understandSurrenderCharges: initialData?.understandSurrenderCharges || false,
    understandLiquidityRestrictions: initialData?.understandLiquidityRestrictions || false,
  });

  const [error, setError] = useState<string | null>(null);

  const updateFormData = (field: keyof FireLightSuitability, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const validateCurrentSection = (): boolean => {
    setError(null);

    switch (currentSection) {
      case 1:
        if (!formData.investmentObjective || !formData.investmentTimeHorizon) {
          setError('Please answer all questions in this section');
          return false;
        }
        break;
      case 2:
        if (
          !formData.liquidityNeeds ||
          !formData.emergencyFunds ||
          !formData.otherInvestments
        ) {
          setError('Please answer all questions in this section');
          return false;
        }
        break;
      case 3:
        if (!formData.riskTolerance || !formData.purposeOfAnnuity) {
          setError('Please answer all questions in this section');
          return false;
        }
        break;
      case 4:
        if (
          !formData.understandSurrenderCharges ||
          !formData.understandLiquidityRestrictions
        ) {
          setError('You must acknowledge understanding of all disclosures');
          return false;
        }
        break;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateCurrentSection()) {
      return;
    }

    if (currentSection < SECTIONS.length) {
      setCurrentSection(currentSection + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleComplete = () => {
    if (!validateCurrentSection()) {
      return;
    }

    // Validate all required fields
    if (
      !formData.investmentObjective ||
      !formData.investmentTimeHorizon ||
      !formData.riskTolerance ||
      !formData.liquidityNeeds ||
      !formData.emergencyFunds ||
      !formData.otherInvestments ||
      !formData.purposeOfAnnuity ||
      !formData.understandSurrenderCharges ||
      !formData.understandLiquidityRestrictions
    ) {
      setError('Please complete all required fields');
      return;
    }

    onComplete(formData as FireLightSuitability);
  };

  const progress = (currentSection / SECTIONS.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Suitability Questionnaire</CardTitle>
          <CardDescription>
            This information helps ensure the annuity is appropriate for your financial situation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm">
              {SECTIONS.map((section) => (
                <div
                  key={section.id}
                  className={`${
                    currentSection === section.id
                      ? 'text-primary font-semibold'
                      : currentSection > section.id
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                  }`}
                >
                  {section.title}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <CardTitle>{SECTIONS[currentSection - 1].title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section 1: Investment Goals */}
          {currentSection === 1 && (
            <>
              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  What is your primary investment objective? *
                </Label>
                <RadioGroup
                  value={formData.investmentObjective}
                  onValueChange={(value) =>
                    updateFormData('investmentObjective', value)
                  }
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="Income" id="income" />
                    <Label htmlFor="income" className="flex-1 cursor-pointer">
                      <div className="font-medium">Income</div>
                      <div className="text-sm text-muted-foreground">
                        Generate regular income from my investments
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="Growth" id="growth" />
                    <Label htmlFor="growth" className="flex-1 cursor-pointer">
                      <div className="font-medium">Growth</div>
                      <div className="text-sm text-muted-foreground">
                        Grow my investment over time
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="Balanced" id="balanced" />
                    <Label htmlFor="balanced" className="flex-1 cursor-pointer">
                      <div className="font-medium">Balanced</div>
                      <div className="text-sm text-muted-foreground">
                        Mix of income and growth
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="Preservation" id="preservation" />
                    <Label htmlFor="preservation" className="flex-1 cursor-pointer">
                      <div className="font-medium">Preservation</div>
                      <div className="text-sm text-muted-foreground">
                        Protect my principal and avoid risk
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  What is your investment time horizon? *
                </Label>
                <RadioGroup
                  value={formData.investmentTimeHorizon}
                  onValueChange={(value) =>
                    updateFormData('investmentTimeHorizon', value)
                  }
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="1-3 years" id="1-3" />
                    <Label htmlFor="1-3" className="flex-1 cursor-pointer">
                      1-3 years
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="4-7 years" id="4-7" />
                    <Label htmlFor="4-7" className="flex-1 cursor-pointer">
                      4-7 years
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="8-10 years" id="8-10" />
                    <Label htmlFor="8-10" className="flex-1 cursor-pointer">
                      8-10 years
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="10+ years" id="10plus" />
                    <Label htmlFor="10plus" className="flex-1 cursor-pointer">
                      10+ years
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}

          {/* Section 2: Financial Situation */}
          {currentSection === 2 && (
            <>
              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  When might you need access to this money? *
                </Label>
                <RadioGroup
                  value={formData.liquidityNeeds}
                  onValueChange={(value) => updateFormData('liquidityNeeds', value)}
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="Immediate" id="immediate" />
                    <Label htmlFor="immediate" className="flex-1 cursor-pointer">
                      <div className="font-medium">Immediate</div>
                      <div className="text-sm text-muted-foreground">
                        I may need access within 1 year
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="Short-Term" id="short-term" />
                    <Label htmlFor="short-term" className="flex-1 cursor-pointer">
                      <div className="font-medium">Short-Term</div>
                      <div className="text-sm text-muted-foreground">
                        I may need access within 1-3 years
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="Long-Term" id="long-term" />
                    <Label htmlFor="long-term" className="flex-1 cursor-pointer">
                      <div className="font-medium">Long-Term</div>
                      <div className="text-sm text-muted-foreground">
                        I won't need access for 3+ years
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="None" id="none" />
                    <Label htmlFor="none" className="flex-1 cursor-pointer">
                      <div className="font-medium">None</div>
                      <div className="text-sm text-muted-foreground">
                        I don't anticipate needing this money
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  Do you have adequate emergency funds (3-6 months of expenses) separate from this
                  investment? *
                </Label>
                <RadioGroup
                  value={formData.emergencyFunds}
                  onValueChange={(value) => updateFormData('emergencyFunds', value)}
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="Yes" id="emergency-yes" />
                    <Label htmlFor="emergency-yes" className="flex-1 cursor-pointer">
                      Yes, I have adequate emergency funds
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="No" id="emergency-no" />
                    <Label htmlFor="emergency-no" className="flex-1 cursor-pointer">
                      No, I do not have adequate emergency funds
                    </Label>
                  </div>
                </RadioGroup>
                {formData.emergencyFunds === 'No' && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="text-sm text-orange-800">
                      <p className="font-semibold mb-1">Important Notice</p>
                      <p>
                        An annuity may not be suitable if you don't have adequate emergency funds.
                        Consider building emergency savings before investing in an annuity.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  Do you have other investments or sources of income? *
                </Label>
                <RadioGroup
                  value={formData.otherInvestments}
                  onValueChange={(value) => updateFormData('otherInvestments', value)}
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="Yes" id="investments-yes" />
                    <Label htmlFor="investments-yes" className="flex-1 cursor-pointer">
                      Yes, I have other investments or income sources
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="No" id="investments-no" />
                    <Label htmlFor="investments-no" className="flex-1 cursor-pointer">
                      No, this would be my primary investment
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}

          {/* Section 3: Risk & Time Horizon */}
          {currentSection === 3 && (
            <>
              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  How would you describe your risk tolerance? *
                </Label>
                <RadioGroup
                  value={formData.riskTolerance}
                  onValueChange={(value) => updateFormData('riskTolerance', value)}
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="Conservative" id="conservative" />
                    <Label htmlFor="conservative" className="flex-1 cursor-pointer">
                      <div className="font-medium">Conservative</div>
                      <div className="text-sm text-muted-foreground">
                        I prefer guaranteed returns and want to minimize risk
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="Moderate" id="moderate" />
                    <Label htmlFor="moderate" className="flex-1 cursor-pointer">
                      <div className="font-medium">Moderate</div>
                      <div className="text-sm text-muted-foreground">
                        I'm willing to accept some risk for potentially higher returns
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="Aggressive" id="aggressive" />
                    <Label htmlFor="aggressive" className="flex-1 cursor-pointer">
                      <div className="font-medium">Aggressive</div>
                      <div className="text-sm text-muted-foreground">
                        I'm comfortable with significant risk for maximum growth potential
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose" className="text-base font-semibold">
                  What is your primary purpose for purchasing this annuity? *
                </Label>
                <Textarea
                  id="purpose"
                  value={formData.purposeOfAnnuity}
                  onChange={(e) => updateFormData('purposeOfAnnuity', e.target.value)}
                  placeholder="e.g., Retirement income, wealth preservation, legacy planning, etc."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </>
          )}

          {/* Section 4: Understanding & Acknowledgment */}
          {currentSection === 4 && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Important Disclosures</h4>
                <p className="text-sm text-blue-800 mb-3">
                  Please read and acknowledge your understanding of the following:
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Checkbox
                    id="surrender-charges"
                    checked={formData.understandSurrenderCharges}
                    onCheckedChange={(checked) =>
                      updateFormData('understandSurrenderCharges', checked)
                    }
                  />
                  <Label htmlFor="surrender-charges" className="flex-1 cursor-pointer text-sm leading-relaxed">
                    <div className="font-semibold mb-1">Surrender Charges</div>
                    <p className="text-muted-foreground">
                      I understand that if I withdraw money from this annuity during the surrender
                      period, I may be charged a surrender fee. The surrender charge schedule has
                      been explained to me, and I understand how it works.
                    </p>
                  </Label>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Checkbox
                    id="liquidity-restrictions"
                    checked={formData.understandLiquidityRestrictions}
                    onCheckedChange={(checked) =>
                      updateFormData('understandLiquidityRestrictions', checked)
                    }
                  />
                  <Label htmlFor="liquidity-restrictions" className="flex-1 cursor-pointer text-sm leading-relaxed">
                    <div className="font-semibold mb-1">Liquidity Restrictions</div>
                    <p className="text-muted-foreground">
                      I understand that annuities are long-term investments and that my money will
                      not be as accessible as it would be in a savings or checking account. I
                      understand that early withdrawals may be subject to surrender charges, IRS
                      penalties, and income taxes.
                    </p>
                  </Label>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                <p className="font-semibold text-yellow-900 mb-2">Suitability Statement</p>
                <p className="text-yellow-800">
                  By completing this questionnaire, you are confirming that the information
                  provided is accurate and complete. This information will be used to determine if
                  this annuity is suitable for your financial situation and investment objectives.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div>
          {currentSection > 1 ? (
            <Button variant="outline" onClick={handlePrevious}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          ) : onBack ? (
            <Button variant="outline" onClick={onBack}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          ) : null}
        </div>

        <div>
          {currentSection < SECTIONS.length ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete}>
              Complete Questionnaire
              <CheckCircle2 className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
