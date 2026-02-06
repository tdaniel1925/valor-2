'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2, Upload } from 'lucide-react';

export default function LongTermCareQuotePage() {
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
    useAge: false, // Toggle between DOB and Age
    gender: '',
    stateOfResidence: '',
    maritalStatus: '',
    spouseName: '',
    height: '',
    weight: '',

    // Coverage Details
    monthlyBenefitAmount: '',
    benefitPeriod: '',
    eliminationPeriod: '',
    inflationProtection: '',
    homeHealthCare: '',
    assistedLivingFacility: '',
    nursingHomeCare: '',

    // Health and Additional Details
    additionalHealthDetails: '',

    // Existing Coverage
    existingLTCCoverage: '',
    premiumBudget: '',

    // Additional Information
    additionalComments: '',
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

      const response = await fetch('/api/quotes/long-term-care', {
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
            Long Term Care Quote Request
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Request a customized long-term care insurance quote
          </p>
        </div>

        {submitStatus === 'success' && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-4 mb-6 sm:mb-8">
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
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 mb-6 sm:mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-medium text-red-800 dark:text-red-200">
                  Failed to submit quote request
                </p>
                <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 mt-1">
                  {errorMessage}
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
                <label className="flex items-center gap-2 mb-2 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    name="useAge"
                    checked={formData.useAge}
                    onChange={handleChange}
                    className="w-5 h-5 sm:w-4 sm:h-4"
                  />
                  <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
                    Use Age instead of Date of Birth
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      disabled={formData.useAge}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      disabled={!formData.useAge}
                      placeholder="Years"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] disabled:opacity-50"
                    />
                  </div>
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
                    State <span className="text-red-500">*</span>
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
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Marital Status
                </label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                >
                  <option value="">Select...</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Spouse Name (if applicable)
                </label>
                <input
                  type="text"
                  name="spouseName"
                  value={formData.spouseName}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Height
                  </label>
                  <input
                    type="text"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="e.g., 5'10&quot;"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Weight
                  </label>
                  <input
                    type="text"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="lbs"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coverage Details */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-lg sm:text-xl">Coverage Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Monthly Benefit Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="monthlyBenefitAmount"
                  value={formData.monthlyBenefitAmount}
                  onChange={handleChange}
                  required
                  placeholder="$"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Benefit Period <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="benefitPeriod"
                    value={formData.benefitPeriod}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  >
                    <option value="">Select...</option>
                    <option value="2 Years">2 Years</option>
                    <option value="3 Years">3 Years</option>
                    <option value="4 Years">4 Years</option>
                    <option value="5 Years">5 Years</option>
                    <option value="Lifetime">Lifetime</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Elimination Period <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="eliminationPeriod"
                    value={formData.eliminationPeriod}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  >
                    <option value="">Select...</option>
                    <option value="30 Days">30 Days</option>
                    <option value="60 Days">60 Days</option>
                    <option value="90 Days">90 Days</option>
                    <option value="180 Days">180 Days</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Inflation Protection <span className="text-red-500">*</span>
                </label>
                <select
                  name="inflationProtection"
                  value={formData.inflationProtection}
                  onChange={handleChange}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                >
                  <option value="">Select...</option>
                  <option value="None">None</option>
                  <option value="3% Simple">3% Simple</option>
                  <option value="3% Compound">3% Compound</option>
                  <option value="5% Simple">5% Simple</option>
                  <option value="5% Compound">5% Compound</option>
                  <option value="CPI">CPI</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Home Health Care Coverage
                </label>
                <select
                  name="homeHealthCare"
                  value={formData.homeHealthCare}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assisted Living Facility Coverage
                </label>
                <select
                  name="assistedLivingFacility"
                  value={formData.assistedLivingFacility}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nursing Home Care Coverage
                </label>
                <select
                  name="nursingHomeCare"
                  value={formData.nursingHomeCare}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Health Information */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-lg sm:text-xl">Health Information</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Details (health, LTC)
                </label>
                <textarea
                  name="additionalHealthDetails"
                  value={formData.additionalHealthDetails}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Please provide any relevant health information or long-term care details"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Existing Coverage and Budget */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-lg sm:text-xl">Existing Coverage and Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Existing LTC Coverage
                </label>
                <textarea
                  name="existingLTCCoverage"
                  value={formData.existingLTCCoverage}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Premium Budget
                </label>
                <input
                  type="text"
                  name="premiumBudget"
                  value={formData.premiumBudget}
                  onChange={handleChange}
                  placeholder="$"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
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
                  Additional Comments
                </label>
                <textarea
                  name="additionalComments"
                  value={formData.additionalComments}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Please attach any relevant medical information or financial documentation that may assist with underwriting.
                </label>
                <div className="mt-2">
                  <label className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 sm:p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer min-h-[120px] flex flex-col items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                        {selectedFile ? selectedFile.name : 'Click to upload file'}
                      </span>
                      {selectedFile && (
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      )}
                    </div>
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
