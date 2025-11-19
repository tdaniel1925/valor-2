/**
 * FireLight API Client
 * Annuity application submission through Hexure FireLight
 */

import type {
  FireLightConfig,
  FireLightApplicationRequest,
  FireLightApplicationResponse,
  FireLightStatusRequest,
  FireLightStatusResponse,
  FireLightESignatureRequest,
  FireLightESignatureResponse,
  FireLight1035Request,
  FireLightHealthCheck,
  FireLightApplicationStatus,
} from './types';

export class FireLightClient {
  private config: FireLightConfig;
  private baseUrl: string;

  constructor(config?: Partial<FireLightConfig>) {
    this.config = {
      apiKey: process.env.FIRELIGHT_API_KEY || '',
      apiSecret: process.env.FIRELIGHT_API_SECRET,
      partnerId: process.env.FIRELIGHT_PARTNER_ID || '',
      environment: (process.env.FIRELIGHT_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      enabled: process.env.FIRELIGHT_ENABLED === 'true',
      baseUrl: process.env.FIRELIGHT_BASE_URL || 'https://api.hexure.com/firelight/v1',
      timeout: 30000,
      features: {
        eSignature: true,
        acordXml: true,
        dtccIntegration: true,
        suitabilityChecks: true,
      },
      ...config,
    };

    this.baseUrl = this.config.baseUrl || 'https://api.hexure.com/firelight/v1';
  }

  /**
   * Create a new annuity application
   */
  async createApplication(
    request: FireLightApplicationRequest
  ): Promise<FireLightApplicationResponse> {
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
      console.error('[FIRELIGHT_CLIENT] Error creating application:', error);
      return {
        success: false,
        status: 'DRAFT' as FireLightApplicationStatus,
        message: 'Failed to create annuity application',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        createdAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Get application status
   */
  async getApplicationStatus(
    request: FireLightStatusRequest
  ): Promise<FireLightStatusResponse> {
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
      console.error('[FIRELIGHT_CLIENT] Error getting status:', error);
      return {
        success: false,
        applicationId: request.applicationId,
        status: 'DRAFT' as FireLightApplicationStatus,
        statusDate: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Request e-signature for application
   */
  async requestESignature(
    request: FireLightESignatureRequest
  ): Promise<FireLightESignatureResponse> {
    if (!this.config.enabled || !this.config.features?.eSignature) {
      return {
        success: true,
        sessionId: `MOCK-${Date.now()}`,
        signatureUrls: request.signers.map((signer) => ({
          role: signer.role,
          url: `https://esign.hexure.com/mock/${request.applicationId}/${signer.role}`,
        })),
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
      console.error('[FIRELIGHT_CLIENT] Error requesting e-signature:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Submit 1035 exchange documentation
   */
  async submit1035Exchange(
    request: FireLight1035Request
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!this.config.enabled) {
      return {
        success: true,
        message: '1035 exchange documentation submitted successfully (mock mode)',
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/applications/${request.applicationId}/1035-exchange`,
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
        throw new Error('Failed to submit 1035 exchange');
      }

      return await response.json();
    } catch (error) {
      console.error('[FIRELIGHT_CLIENT] Error submitting 1035:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate ACORD XML for application
   */
  async generateAcordXml(applicationId: string): Promise<{ success: boolean; xml?: string; error?: string }> {
    if (!this.config.enabled || !this.config.features?.acordXml) {
      return {
        success: true,
        xml: `<?xml version="1.0"?><ACORD><Application id="${applicationId}">Mock ACORD XML</Application></ACORD>`,
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/applications/${applicationId}/acord`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-Partner-ID': this.config.partnerId,
            'Accept': 'application/xml',
          },
          signal: AbortSignal.timeout(this.config.timeout!),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate ACORD XML');
      }

      const xml = await response.text();
      return { success: true, xml };
    } catch (error) {
      console.error('[FIRELIGHT_CLIENT] Error generating ACORD:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<FireLightHealthCheck> {
    if (!this.config.enabled) {
      return {
        healthy: true,
        message: 'FireLight integration running in mock mode',
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
        message: 'FireLight API is healthy',
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
    request: FireLightApplicationRequest
  ): FireLightApplicationResponse {
    const applicationId = `FL-${Date.now()}`;

    return {
      success: true,
      applicationId,
      confirmationNumber: `CONF-${Date.now()}`,
      status: 'DRAFT' as FireLightApplicationStatus,
      applicationUrl: `https://portal.hexure.com/firelight/applications/${applicationId}`,
      eSignUrl: `https://esign.hexure.com/${applicationId}`,
      reviewUrl: `https://portal.hexure.com/firelight/review/${applicationId}`,
      dtccReferenceNumber: `DTCC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      message: 'Annuity application created successfully (mock mode)',
      warnings: request.suitability.emergencyFunds === 'No'
        ? ['Client indicated no emergency funds - review suitability']
        : [],
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Mock get status (for development/testing)
   */
  private mockGetStatus(request: FireLightStatusRequest): FireLightStatusResponse {
    return {
      success: true,
      applicationId: request.applicationId,
      status: 'IN_REVIEW' as FireLightApplicationStatus,
      statusDate: new Date().toISOString(),
      statusNotes: 'Application is currently under review by carrier',
      dtccStatus: 'SUBMITTED',
      dtccStatusDate: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const fireLightClient = new FireLightClient();
