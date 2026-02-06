'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2, Upload } from 'lucide-react';

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export default function InforceReviewQuotePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    // Agent Information
    agentName: '',
    agentEmail: '',

    // Client Information
    clientName: '',
    dateOfBirth: '',
    age: '',
    useAge: false,
    riskClass: '',
    state: '',

    // Current Policy Information
    currentCarrier: '',
    policyType: '',
    policyNumber: '',
    issueDate: '',
    deathBenefit: '',
    cashValue: '',
    loanBalance: '',
    currentPremium: '',
    premiumMode: '',

    // Review Objectives
    reviewObjectives: '',

    // Additional Information
    additionalInfo: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checkbox.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      let fileData = null;
      if (selectedFile) {
        const reader = new FileReader();
        fileData = await new Promise((resolve, reject) => {
          reader.onload = () => {
            const base64 = reader.result as string;
            resolve({
              filename: selectedFile.name,
              content: base64.split(',')[1], // Remove data:mime;base64, prefix
              contentType: selectedFile.type,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      const response = await fetch('/api/quotes/inforce-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          attachment: fileData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit quote request');
      }

      setSubmitStatus('success');

      // Reset form after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Inforce Policy Review Request
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Request a comprehensive review of an existing life insurance policy
          </p>
        </div>

        {submitStatus === 'success' && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-medium text-green-800 dark:text-green-200">
                  Review request submitted successfully!
                </p>
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 mt-1">
                  Redirecting to dashboard...
                </p>
              </div>
            </div>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-medium text-red-800 dark:text-red-200">
                  Failed to submit review request
                </p>
                <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 mt-1">
                  {errorMessage || 'Please try again or contact support.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Agent Information */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-lg sm:text-xl">Agent Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Agent Name
                </label>
                <input
                  type="text"
                  name="agentName"
                  value={formData.agentName}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="agentEmail"
                  value={formData.agentEmail}
                  onChange={handleChange}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-lg sm:text-xl">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Date of Birth or Age
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                    <input
                      type="checkbox"
                      name="useAge"
                      checked={formData.useAge}
                      onChange={handleChange}
                      className="w-5 h-5 sm:w-4 sm:h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm sm:text-base text-gray-900 dark:text-gray-100">Use Age instead of Date of Birth</span>
                  </label>
                  {!formData.useAge ? (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                    />
                  ) : (
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      placeholder="Age"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Risk Class
                </label>
                <select
                  name="riskClass"
                  value={formData.riskClass}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                >
                  <option value="">Select...</option>
                  <option value="Preferred Plus">Preferred Plus</option>
                  <option value="Preferred">Preferred</option>
                  <option value="Standard Plus">Standard Plus</option>
                  <option value="Standard">Standard</option>
                  <option value="Substandard">Substandard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                >
                  <option value="">Select State...</option>
                  {US_STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Current Policy Information */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-lg sm:text-xl">Current Policy Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Carrier
                </label>
                <input
                  type="text"
                  name="currentCarrier"
                  value={formData.currentCarrier}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Policy Type
                  </label>
                  <select
                    name="policyType"
                    value={formData.policyType}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  >
                    <option value="">Select...</option>
                    <option value="Whole Life">Whole Life</option>
                    <option value="Universal Life">Universal Life</option>
                    <option value="Indexed Universal Life">Indexed Universal Life</option>
                    <option value="Variable Universal Life">Variable Universal Life</option>
                    <option value="Term Life">Term Life</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Policy Number
                  </label>
                  <input
                    type="text"
                    name="policyNumber"
                    value={formData.policyNumber}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Issue Date
                </label>
                <input
                  type="date"
                  name="issueDate"
                  value={formData.issueDate}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Death Benefit
                  </label>
                  <input
                    type="text"
                    name="deathBenefit"
                    value={formData.deathBenefit}
                    onChange={handleChange}
                    placeholder="$"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cash Value
                  </label>
                  <input
                    type="text"
                    name="cashValue"
                    value={formData.cashValue}
                    onChange={handleChange}
                    placeholder="$"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Loan Balance
                </label>
                <input
                  type="text"
                  name="loanBalance"
                  value={formData.loanBalance}
                  onChange={handleChange}
                  placeholder="$"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Premium
                  </label>
                  <input
                    type="text"
                    name="currentPremium"
                    value={formData.currentPremium}
                    onChange={handleChange}
                    placeholder="$"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Premium Mode
                  </label>
                  <select
                    name="premiumMode"
                    value={formData.premiumMode}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  >
                    <option value="">Select...</option>
                    <option value="Annual">Annual</option>
                    <option value="Semi-Annual">Semi-Annual</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review Objectives */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-lg sm:text-xl">Review Objectives</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  What would you like to accomplish? <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="reviewObjectives"
                  value={formData.reviewObjectives}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-lg sm:text-xl">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Information (medical, medications)
                </label>
                <textarea
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-lg sm:text-xl">Supporting Documentation</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Please attach the most recent annual statement and in-force illustration.
                </label>
                <div
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="mt-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 sm:p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer min-h-[120px] flex flex-col items-center justify-center"
                >
                  <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mb-3" />
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                    {selectedFile ? selectedFile.name : 'PDF, DOC, or image files (max 10MB)'}
                  </p>
                  <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 text-base font-medium min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 text-base font-medium min-h-[44px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Quote Request'
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
