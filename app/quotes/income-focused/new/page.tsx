'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2, Upload } from 'lucide-react';

export default function IncomeFocusedQuotePage() {
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
    dobOrAge: 'dob',
    dateOfBirth: '',
    age: '',
    gender: '',
    stateOfResidence: '',
    riskClass: '',

    // Financial Objectives
    initialPremium: '',
    premiumFrequency: '',
    incomeAge: '',
    preferredFaceAmount: '',
    fundingDuration: '',
    otherRidersRequested: '',
    additionalContributions: '',
    additionalContributionsType: '',

    // Product Preferences
    preferredSolution: '',

    // Additional Information
    healthIssues: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
              content: base64.split(',')[1],
              contentType: selectedFile.type,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      const response = await fetch('/api/quotes/income-focused', {
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

  const usStates = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Income Solution Quote Request
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Request a customized income-focused life insurance quote
          </p>
        </div>

        {submitStatus === 'success' && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-medium text-green-800 dark:text-green-200">
                  Quote request submitted successfully!
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
                  Failed to submit quote request
                </p>
                <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 mt-1">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Agent Information */}
          <Card>
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-lg sm:text-xl">Agent Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Agent Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="agentName"
                  value={formData.agentName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Agent Email <span className="text-red-500">*</span>
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
          <Card>
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
                  Date of Birth OR Age
                </label>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                      <input
                        type="radio"
                        name="dobOrAge"
                        value="dob"
                        checked={formData.dobOrAge === 'dob'}
                        onChange={handleChange}
                        className="w-5 h-5 sm:w-4 sm:h-4 text-blue-600"
                      />
                      <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Date of Birth</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                      <input
                        type="radio"
                        name="dobOrAge"
                        value="age"
                        checked={formData.dobOrAge === 'age'}
                        onChange={handleChange}
                        className="w-5 h-5 sm:w-4 sm:h-4 text-blue-600"
                      />
                      <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Age</span>
                    </label>
                  </div>
                  {formData.dobOrAge === 'dob' ? (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
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
                    <option value="Standard">Standard</option>
                    <option value="Preferred Tobacco">Preferred Tobacco</option>
                    <option value="Standard Tobacco">Standard Tobacco</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State of Residence <span className="text-red-500">*</span>
                </label>
                <select
                  name="stateOfResidence"
                  value={formData.stateOfResidence}
                  onChange={handleChange}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                >
                  <option value="">Select state...</option>
                  {usStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Financial Objectives */}
          <Card>
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-lg sm:text-xl">Financial Objectives</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Initial Premium
                  </label>
                  <input
                    type="text"
                    name="initialPremium"
                    value={formData.initialPremium}
                    onChange={handleChange}
                    placeholder="$"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Premium Frequency
                  </label>
                  <select
                    name="premiumFrequency"
                    value={formData.premiumFrequency}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  >
                    <option value="">Select...</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Semi-Annual">Semi-Annual</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Preferred Face Amount (if any)
                </label>
                <input
                  type="text"
                  name="preferredFaceAmount"
                  value={formData.preferredFaceAmount}
                  onChange={handleChange}
                  placeholder="$"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Funding Duration
                </label>
                <input
                  type="text"
                  name="fundingDuration"
                  value={formData.fundingDuration}
                  onChange={handleChange}
                  placeholder="e.g., 10, 15, 20, 25, 30"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Income Age
                </label>
                <input
                  type="number"
                  name="incomeAge"
                  value={formData.incomeAge}
                  onChange={handleChange}
                  placeholder="e.g., 65"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Other Riders Requested
                </label>
                <input
                  type="text"
                  name="otherRidersRequested"
                  value={formData.otherRidersRequested}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Any Additional Contributions
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <input
                    type="text"
                    name="additionalContributions"
                    value={formData.additionalContributions}
                    onChange={handleChange}
                    placeholder="Amount"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  />
                  <select
                    name="additionalContributionsType"
                    value={formData.additionalContributionsType}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  >
                    <option value="">Select type...</option>
                    <option value="Lump Sum">Lump Sum</option>
                    <option value="1035 Exchange">1035 Exchange</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Preferences */}
          <Card>
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-lg sm:text-xl">Product Preferences</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Preferred Solution
                </label>
                <select
                  name="preferredSolution"
                  value={formData.preferredSolution}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                >
                  <option value="">Select...</option>
                  <option value="IUL">IUL</option>
                  <option value="Whole Life">Whole Life</option>
                  <option value="Both">Both</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-lg sm:text-xl">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Comments (health, medications, etc.)
                </label>
                <textarea
                  name="healthIssues"
                  value={formData.healthIssues}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-lg sm:text-xl">Supporting Documentation</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Please attach any relevant medical information or financial documentation that may assist with underwriting.
                </label>
                <div className="mt-2">
                  <label className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 sm:p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer min-h-[120px] flex flex-col items-center justify-center">
                    <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mb-3" />
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                    </p>
                    {selectedFile && (
                      <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    )}
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                  </label>
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
