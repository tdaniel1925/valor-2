'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { LifeInsuranceApplicationForm } from '@/components/applications/LifeInsuranceApplicationForm';
import type { IGoApplicationRequest, IGoApplicationResponse } from '@/lib/integrations/igo/types';

export default function NewLifeApplicationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSaving, setIsSaving] = useState(false);

  // Get query parameters for pre-filling
  const quoteId = searchParams?.get('quoteId') || undefined;
  const carrierId = searchParams?.get('carrierId') || undefined;
  const carrierName = searchParams?.get('carrierName') || undefined;
  const productId = searchParams?.get('productId') || undefined;
  const productName = searchParams?.get('productName') || undefined;
  const faceAmount = searchParams?.get('faceAmount')
    ? parseInt(searchParams.get('faceAmount')!)
    : 500000;

  // In production, this would come from the authenticated user
  const agentId = 'AGENT-001';

  const handleSubmit = async (application: IGoApplicationRequest) => {
    const response = await fetch('/api/applications/life', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(application),
    });

    const result: IGoApplicationResponse = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.errors?.[0] || result.message || 'Failed to submit application');
    }

    // Redirect to success page or application detail page
    if (result.applicationId) {
      router.push(`/applications/life/${result.applicationId}?success=true`);
    }
  };

  const handleSaveDraft = async (application: Partial<IGoApplicationRequest>) => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('life-application-draft', JSON.stringify(application));

      // In production, also save to database via API
      const response = await fetch('/api/applications/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'LIFE',
          data: application,
          quoteId,
        }),
      }).catch(() => null); // Fail silently if API doesn't exist yet

      // Show success feedback
      alert('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LifeInsuranceApplicationForm
          quoteId={quoteId}
          carrierId={carrierId}
          carrierName={carrierName}
          productId={productId}
          productName={productName}
          faceAmount={faceAmount}
          agentId={agentId}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
        />
      </div>
    </AppLayout>
  );
}
