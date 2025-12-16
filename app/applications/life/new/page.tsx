'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, User, Briefcase, HeartPulse, Shield, Check } from 'lucide-react';

export default function NewLifeApplicationPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    ssn: '',
    gender: '',
    marital status: '',
    email: '',
    phone: '',

    // Address
    street: '',
    city: '',
    state: '',
    zipCode: '',

    // Employment
    occupation: '',
    employer: '',
    annualIncome: '',

    // Coverage
    coverageAmount: '',
    productType: '',
    term: '',

    // Health
    height: '',
    weight: '',
    tobaccoUse: '',
    medicalConditions: '',
    medications: '',

    // Beneficiaries
    primaryBeneficiary: '',
    primaryRelationship: '',
    primaryShare: '100',
    contingentBeneficiary: '',
    contingentRelationship: '',
  });

  const steps = [
    { id: 0, title: 'Personal Info', icon: User },
    { id: 1, title: 'Employment', icon: Briefcase },
    { id: 2, title: 'Coverage', icon: Shield },
    { id: 3, title: 'Health', icon: HeartPulse },
    { id: 4, title: 'Beneficiaries', icon: FileText },
    { id: 5, title: 'Review', icon: Check },
  ];

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    alert('Application submitted! In production, this would send the application to the carrier for underwriting.');
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            New Life Insurance Application
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete the application form below to submit for underwriting
          </p>
        </div>

        {/* Progress Steps */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;

                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : isCompleted
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <span
                        className={`text-xs mt-2 ${
                          isActive || isCompleted
                            ? 'text-gray-900 dark:text-gray-100 font-semibold'
                            : 'text-gray-500 dark:text-gray-500'
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`h-1 w-16 mx-2 ${
                          isCompleted ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep].title}</CardTitle>
            <CardDescription>Step {currentStep + 1} of {steps.length}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Information */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input
                      id="middleName"
                      value={formData.middleName}
                      onChange={(e) => handleChange('middleName', e.target.value)}
                      placeholder="Michael"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      placeholder="Smith"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ssn">Social Security Number *</Label>
                    <Input
                      id="ssn"
                      value={formData.ssn}
                      onChange={(e) => handleChange('ssn', e.target.value)}
                      placeholder="XXX-XX-XXXX"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="maritalStatus">Marital Status *</Label>
                    <Select value={formData.maritalStatus} onValueChange={(value) => handleChange('maritalStatus', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="john.smith@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="street">Street Address *</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => handleChange('street', e.target.value)}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        placeholder="Los Angeles"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleChange('state', e.target.value)}
                        placeholder="CA"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code *</Label>
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) => handleChange('zipCode', e.target.value)}
                        placeholder="90001"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Employment Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="occupation">Occupation *</Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => handleChange('occupation', e.target.value)}
                    placeholder="Software Engineer"
                  />
                </div>
                <div>
                  <Label htmlFor="employer">Employer *</Label>
                  <Input
                    id="employer"
                    value={formData.employer}
                    onChange={(e) => handleChange('employer', e.target.value)}
                    placeholder="ABC Corporation"
                  />
                </div>
                <div>
                  <Label htmlFor="annualIncome">Annual Income *</Label>
                  <Input
                    id="annualIncome"
                    type="number"
                    value={formData.annualIncome}
                    onChange={(e) => handleChange('annualIncome', e.target.value)}
                    placeholder="75000"
                  />
                </div>
              </div>
            )}

            {/* Coverage Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="productType">Product Type *</Label>
                  <Select value={formData.productType} onValueChange={(value) => handleChange('productType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="term">Term Life</SelectItem>
                      <SelectItem value="whole">Whole Life</SelectItem>
                      <SelectItem value="universal">Universal Life</SelectItem>
                      <SelectItem value="variable">Variable Universal Life</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="coverageAmount">Coverage Amount *</Label>
                  <Input
                    id="coverageAmount"
                    type="number"
                    value={formData.coverageAmount}
                    onChange={(e) => handleChange('coverageAmount', e.target.value)}
                    placeholder="500000"
                  />
                </div>
                {formData.productType === 'term' && (
                  <div>
                    <Label htmlFor="term">Term Length (years) *</Label>
                    <Select value={formData.term} onValueChange={(value) => handleChange('term', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select term length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 Years</SelectItem>
                        <SelectItem value="15">15 Years</SelectItem>
                        <SelectItem value="20">20 Years</SelectItem>
                        <SelectItem value="30">30 Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Health Information */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="height">Height (inches) *</Label>
                    <Input
                      id="height"
                      type="number"
                      value={formData.height}
                      onChange={(e) => handleChange('height', e.target.value)}
                      placeholder="70"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (lbs) *</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={formData.weight}
                      onChange={(e) => handleChange('weight', e.target.value)}
                      placeholder="180"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tobaccoUse">Tobacco Use (last 12 months) *</Label>
                  <Select value={formData.tobaccoUse} onValueChange={(value) => handleChange('tobaccoUse', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tobacco use" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="medicalConditions">Medical Conditions</Label>
                  <Textarea
                    id="medicalConditions"
                    value={formData.medicalConditions}
                    onChange={(e) => handleChange('medicalConditions', e.target.value)}
                    placeholder="List any medical conditions, surgeries, or hospitalizations"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="medications">Current Medications</Label>
                  <Textarea
                    id="medications"
                    value={formData.medications}
                    onChange={(e) => handleChange('medications', e.target.value)}
                    placeholder="List all medications currently taking"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Beneficiaries */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Primary Beneficiary</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="primaryBeneficiary">Full Name *</Label>
                      <Input
                        id="primaryBeneficiary"
                        value={formData.primaryBeneficiary}
                        onChange={(e) => handleChange('primaryBeneficiary', e.target.value)}
                        placeholder="Jane Smith"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="primaryRelationship">Relationship *</Label>
                        <Input
                          id="primaryRelationship"
                          value={formData.primaryRelationship}
                          onChange={(e) => handleChange('primaryRelationship', e.target.value)}
                          placeholder="Spouse"
                        />
                      </div>
                      <div>
                        <Label htmlFor="primaryShare">Share % *</Label>
                        <Input
                          id="primaryShare"
                          type="number"
                          value={formData.primaryShare}
                          onChange={(e) => handleChange('primaryShare', e.target.value)}
                          placeholder="100"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Contingent Beneficiary (Optional)</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="contingentBeneficiary">Full Name</Label>
                      <Input
                        id="contingentBeneficiary"
                        value={formData.contingentBeneficiary}
                        onChange={(e) => handleChange('contingentBeneficiary', e.target.value)}
                        placeholder="John Smith Jr."
                      />
                    </div>
                    <div>
                      <Label htmlFor="contingentRelationship">Relationship</Label>
                      <Input
                        id="contingentRelationship"
                        value={formData.contingentRelationship}
                        onChange={(e) => handleChange('contingentRelationship', e.target.value)}
                        placeholder="Child"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Review */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Application Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-2">Applicant</h4>
                      <p className="text-lg font-semibold">{formData.firstName} {formData.lastName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        DOB: {formData.dateOfBirth} • {formData.gender} • {formData.maritalStatus}
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-2">Coverage</h4>
                      <p className="text-lg font-semibold">
                        ${parseInt(formData.coverageAmount || '0').toLocaleString()} {formData.productType}
                      </p>
                      {formData.term && <p className="text-sm text-gray-600 dark:text-gray-400">{formData.term}-Year Term</p>}
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-2">Beneficiary</h4>
                      <p className="font-semibold">{formData.primaryBeneficiary}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formData.primaryRelationship} • {formData.primaryShare}%</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">!</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                          Ready to Submit
                        </h3>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          By clicking Submit Application, you authorize this application to be sent to the carrier
                          for underwriting review. The carrier may require additional information or a medical exam.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                Previous
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                  Submit Application
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
