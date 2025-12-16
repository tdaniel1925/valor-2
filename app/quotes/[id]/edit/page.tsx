'use client';

import { use, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface QuoteFormData {
  // Client Information
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientDOB: string;
  clientAge: number;
  gender: 'Male' | 'Female' | '';
  smoker: string;
  healthClass: string;

  // Policy Information
  policyType: string;
  carrier: string;
  productName: string;
  coverageAmount: string;
  term: string;
  monthlyPremium: string;
  annualPremium: string;

  // Additional Information
  notes: string;
  status: string;
}

export default function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const quoteId = resolvedParams.id;
  const router = useRouter();

  // Initialize with sample data
  const [formData, setFormData] = useState<QuoteFormData>({
    // Client Information
    clientName: 'John Smith',
    clientEmail: 'john.smith@email.com',
    clientPhone: '(555) 123-4567',
    clientDOB: '1985-06-15',
    clientAge: 39,
    gender: 'Male',
    smoker: 'no',
    healthClass: 'preferred-plus',

    // Policy Information
    policyType: 'term',
    carrier: 'protective',
    productName: 'Protective Classic Choice Term 20',
    coverageAmount: '500000',
    term: '20',
    monthlyPremium: '33',
    annualPremium: '395',

    // Additional Information
    notes: 'Client is interested in adding accidental death benefit rider. Follow up scheduled for next week.',
    status: 'approved',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof QuoteFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Auto-calculate annual premium when monthly changes
    if (field === 'monthlyPremium') {
      const monthly = parseFloat(value as string);
      if (!isNaN(monthly)) {
        setFormData(prev => ({
          ...prev,
          annualPremium: (monthly * 12).toString(),
        }));
      }
    }

    // Auto-calculate monthly premium when annual changes
    if (field === 'annualPremium') {
      const annual = parseFloat(value as string);
      if (!isNaN(annual)) {
        setFormData(prev => ({
          ...prev,
          monthlyPremium: (annual / 12).toFixed(2),
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    alert('Quote updated successfully!');
    router.push(`/quotes/${quoteId}`);
  };

  const handleCancel = () => {
    router.push(`/quotes/${quoteId}`);
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Edit Quote
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Quote ID: {quoteId}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>Update client personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Full Name *</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => handleChange('clientName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clientEmail">Email *</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => handleChange('clientEmail', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clientPhone">Phone *</Label>
                  <Input
                    id="clientPhone"
                    value={formData.clientPhone}
                    onChange={(e) => handleChange('clientPhone', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clientDOB">Date of Birth *</Label>
                  <Input
                    id="clientDOB"
                    type="date"
                    value={formData.clientDOB}
                    onChange={(e) => handleChange('clientDOB', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="smoker">Smoker Status *</Label>
                  <Select value={formData.smoker} onValueChange={(value) => handleChange('smoker', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select smoker status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="healthClass">Health Class</Label>
                  <Select value={formData.healthClass} onValueChange={(value) => handleChange('healthClass', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select health class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preferred-plus">Preferred Plus</SelectItem>
                      <SelectItem value="preferred">Preferred</SelectItem>
                      <SelectItem value="standard-plus">Standard Plus</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="rated">Rated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Policy Information */}
          <Card>
            <CardHeader>
              <CardTitle>Policy Information</CardTitle>
              <CardDescription>Update policy details and coverage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="policyType">Policy Type *</Label>
                  <Select value={formData.policyType} onValueChange={(value) => handleChange('policyType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select policy type" />
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
                  <Label htmlFor="carrier">Carrier *</Label>
                  <Select value={formData.carrier} onValueChange={(value) => handleChange('carrier', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="protective">Protective Life</SelectItem>
                      <SelectItem value="prudential">Prudential</SelectItem>
                      <SelectItem value="metlife">MetLife</SelectItem>
                      <SelectItem value="pacific">Pacific Life</SelectItem>
                      <SelectItem value="massmutual">MassMutual</SelectItem>
                      <SelectItem value="nationwide">Nationwide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input
                    id="productName"
                    value={formData.productName}
                    onChange={(e) => handleChange('productName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="coverageAmount">Coverage Amount ($) *</Label>
                  <Input
                    id="coverageAmount"
                    type="number"
                    value={formData.coverageAmount}
                    onChange={(e) => handleChange('coverageAmount', e.target.value)}
                    required
                  />
                </div>
                {formData.policyType === 'term' && (
                  <div>
                    <Label htmlFor="term">Term Length (years) *</Label>
                    <Select value={formData.term} onValueChange={(value) => handleChange('term', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 years</SelectItem>
                        <SelectItem value="15">15 years</SelectItem>
                        <SelectItem value="20">20 years</SelectItem>
                        <SelectItem value="25">25 years</SelectItem>
                        <SelectItem value="30">30 years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Premium Information */}
          <Card>
            <CardHeader>
              <CardTitle>Premium Information</CardTitle>
              <CardDescription>Update premium amounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monthlyPremium">Monthly Premium ($) *</Label>
                  <Input
                    id="monthlyPremium"
                    type="number"
                    step="0.01"
                    value={formData.monthlyPremium}
                    onChange={(e) => handleChange('monthlyPremium', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="annualPremium">Annual Premium ($) *</Label>
                  <Input
                    id="annualPremium"
                    type="number"
                    step="0.01"
                    value={formData.annualPremium}
                    onChange={(e) => handleChange('annualPremium', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Note:</strong> Monthly and annual premiums are automatically synchronized.
                  Changing one will update the other.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Quote status and notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Quote Status *</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={4}
                  placeholder="Add any additional notes about this quote..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
