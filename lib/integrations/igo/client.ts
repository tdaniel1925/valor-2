/**
 * iGO e-App API Client
 * Electronic insurance application submission through iPipeline iGO
 */

import type {
  IGoConfig,
  IGoApplicationRequest,
  IGoApplicationResponse,
  IGoStatusRequest,
  IGoStatusResponse,
  IGoSubmitRequirementRequest,
  IgoPrefillRequest,
  IGoESignatureRequest,
  IGoESignatureResponse,
  IGoHealthCheck,
  ApplicationStatus,
} from './types';

export class IGoClient {
  private config: IGoConfig;
  private baseUrl: string;

  constructor(config?: Partial<IGoConfig>) {
    this.config = {
      apiKey: process.env.IGO_API_KEY || '',
      apiSecret: process.env.IGO_API_SECRET,
      partnerId: process.env.IGO_PARTNER_ID || '',
      environment: (process.env.IGO_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      enabled: process.env.IGO_ENABLED === 'true',
      baseUrl: process.env.IGO_BASE_URL || 'https://api.ipipeline.com/igo/v1',
      timeout: 30000,
      features: {
        eSignature: true,
        prefillFromQuote: true,
        emailValidation: true,
        physicianLookup: true,
        bankVerification: true,
      },
      ...config,
    };

    this.baseUrl = this.config.baseUrl || 'https://api.ipipeline.com/igo/v1';
  }

  /**
   * Create a new application
   */
  async createApplication(
    request: IGoApplicationRequest
  ): Promise<IGoApplicationResponse> {
    if (!this.config.enabled) {
      return this.mockCreateApplication(request);
    }

    try {
      const response = await fetch(`${this.baseUrl}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Partner-ID': this.config.partnerId,
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.config.timeout!),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create application');
      }

      return await response.json();
    } catch (error) {
      console.error('[IGO_CLIENT] Error creating application:', error);
      return {
        success: false,
        status: 'DRAFT' as ApplicationStatus,
        message: 'Failed to create application',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        createdAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Get application status
   */
  async getApplicationStatus(
    request: IGoStatusRequest
  ): Promise<IGoStatusResponse> {
    if (!this.config.enabled) {
      return this.mockGetStatus(request);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/applications/${request.applicationId}/status`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-Partner-ID': this.config.partnerId,
          },
          signal: AbortSignal.timeout(this.config.timeout!),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get application status');
      }

      return await response.json();
    } catch (error) {
      console.error('[IGO_CLIENT] Error getting status:', error);
      return {
        success: false,
        applicationId: request.applicationId,
        status: 'DRAFT' as ApplicationStatus,
        statusDate: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Submit a requirement (document upload)
   */
  async submitRequirement(
    request: IGoSubmitRequirementRequest
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!this.config.enabled) {
      return {
        success: true,
        message: 'Requirement submitted successfully (mock mode)',
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/applications/${request.applicationId}/requirements`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-Partner-ID': this.config.partnerId,
          },
          body: JSON.stringify(request),
          signal: AbortSignal.timeout(this.config.timeout!),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit requirement');
      }

      return await response.json();
    } catch (error) {
      console.error('[IGO_CLIENT] Error submitting requirement:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Pre-fill application from quote
   */
  async prefillFromQuote(request: IgoPrefillRequest): Promise<Partial<IGoApplicationRequest>> {
    if (!this.config.features?.prefillFromQuote) {
      throw new Error('Pre-fill from quote feature is not enabled');
    }

    // This would typically call an internal service to fetch quote data
    // For now, return the provided applicant/beneficiary data
    return {
      applicant: request.applicant as any,
      beneficiaries: request.beneficiaries as any,
    };
  }

  /**
   * Request e-signature
   */
  async requestESignature(
    request: IGoESignatureRequest
  ): Promise<IGoESignatureResponse> {
    if (!this.config.enabled || !this.config.features?.eSignature) {
      return {
        success: true,
        sessionId: `MOCK-${Date.now()}`,
        signatureUrl: `https://esign.ipipeline.com/mock/${request.applicationId}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/applications/${request.applicationId}/esignature`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-Partner-ID': this.config.partnerId,
          },
          body: JSON.stringify(request),
          signal: AbortSignal.timeout(this.config.timeout!),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to request e-signature');
      }

      return await response.json();
    } catch (error) {
      console.error('[IGO_CLIENT] Error requesting e-signature:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<IGoHealthCheck> {
    if (!this.config.enabled) {
      return {
        healthy: true,
        message: 'iGO integration running in mock mode',
        lastChecked: new Date(),
        environment: 'mock',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error('Health check failed');
      }

      const data = await response.json();
      return {
        healthy: true,
        message: 'iGO API is healthy',
        lastChecked: new Date(),
        environment: this.config.environment,
        version: data.version,
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Health check failed',
        lastChecked: new Date(),
        environment: this.config.environment,
      };
    }
  }

  /**
   * Mock create application (for development/testing)
   */
  private mockCreateApplication(
    request: IGoApplicationRequest
  ): IGoApplicationResponse {
    const applicationId = `IGO-${Date.now()}`;

    return {
      success: true,
      applicationId,
      confirmationNumber: `CONF-${Date.now()}`,
      status: 'DRAFT' as ApplicationStatus,
      applicationUrl: `https://portal.ipipeline.com/igo/applications/${applicationId}`,
      eSignUrl: `https://esign.ipipeline.com/${applicationId}`,
      requirements: [
        {
          type: 'Medical Exam',
          description: 'Paramedical examination required',
          status: 'Pending',
        },
        {
          type: 'APS',
          description: 'Attending Physician Statement',
          status: 'Pending',
        },
      ],
      message: 'Application created successfully (mock mode)',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Mock get status (for development/testing)
   */
  private mockGetStatus(request: IGoStatusRequest): IGoStatusResponse {
    return {
      success: true,
      applicationId: request.applicationId,
      status: 'IN_UNDERWRITING' as ApplicationStatus,
      statusDate: new Date().toISOString(),
      statusNotes: 'Application is currently in underwriting review',
      requirements: [
        {
          id: 'REQ-001',
          type: 'Medical Exam',
          description: 'Paramedical examination required',
          status: 'Completed',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          completedDate: new Date().toISOString(),
        },
        {
          id: 'REQ-002',
          type: 'APS',
          description: 'Attending Physician Statement',
          status: 'Pending',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    };
  }
}

// Export singleton instance
export const iGoClient = new IGoClient();
