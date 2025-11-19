/**
 * iPipeline API Client for term life insurance quotes and e-applications
 */

import { BaseIntegration } from '../base-integration';
import { iPipelineConfig } from '../config';
import type {
  IPipelineQuoteRequest,
  IPipelineQuoteResponse,
  IPipelineQuote,
  IPipelineEAppRequest,
  IPipelineEAppResponse,
  IPipelineApplicationStatus,
} from './types';

export class IPipelineClient extends BaseIntegration {
  get name(): string {
    return 'iPipeline';
  }

  get baseUrl(): string {
    return this.config.baseUrl || 'https://api.ipipeline.com/v1';
  }

  constructor() {
    super(iPipelineConfig);
  }

  /**
   * Get term life insurance quotes
   */
  async getTermQuotes(
    request: IPipelineQuoteRequest
  ): Promise<IPipelineQuoteResponse> {
    // For development: return mock data if API is not enabled
    if (!this.config.enabled || !this.config.apiKey) {
      console.log('[IPIPELINE_MOCK] Returning mock quote data');
      return this.getMockQuotes(request);
    }

    try {
      const response = await this.request<IPipelineQuoteResponse>(
        '/quotes/term',
        {
          method: 'POST',
          body: JSON.stringify(request),
          headers: {
            'X-API-Key': this.config.apiKey,
            'X-API-Secret': this.config.apiSecret || '',
          },
        }
      );

      return response;
    } catch (error) {
      console.error('iPipeline API error:', error);
      return {
        success: false,
        quotes: [],
        requestId: `error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Failed to fetch quotes',
      };
    }
  }

  /**
   * Initiate electronic application
   */
  async startElectronicApplication(
    request: IPipelineEAppRequest
  ): Promise<IPipelineEAppResponse> {
    if (!this.config.enabled || !this.config.apiKey) {
      console.log('[IPIPELINE_MOCK] Returning mock e-app data');
      return {
        success: true,
        applicationId: `mock-app-${Date.now()}`,
        applicationUrl: 'https://mock.ipipeline.com/application/mock-app-123',
        status: 'pending',
        message: 'Mock application created (iPipeline not configured)',
      };
    }

    try {
      const response = await this.request<IPipelineEAppResponse>(
        '/applications',
        {
          method: 'POST',
          body: JSON.stringify(request),
          headers: {
            'X-API-Key': this.config.apiKey,
            'X-API-Secret': this.config.apiSecret || '',
          },
        }
      );

      return response;
    } catch (error) {
      console.error('iPipeline e-app error:', error);
      return {
        success: false,
        applicationId: '',
        applicationUrl: '',
        status: 'pending',
        error: error instanceof Error ? error.message : 'Failed to start application',
      };
    }
  }

  /**
   * Check application status
   */
  async getApplicationStatus(
    applicationId: string
  ): Promise<IPipelineApplicationStatus | null> {
    if (!this.config.enabled || !this.config.apiKey) {
      console.log('[IPIPELINE_MOCK] Returning mock application status');
      return {
        applicationId,
        status: 'in_progress',
        carrierName: 'Mock Carrier',
        productName: 'Mock Term Life 20',
        faceAmount: 500000,
        applicantName: 'John Doe',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statusDetails: 'Application in progress',
      };
    }

    try {
      const response = await this.request<IPipelineApplicationStatus>(
        `/applications/${applicationId}`,
        {
          method: 'GET',
          headers: {
            'X-API-Key': this.config.apiKey,
            'X-API-Secret': this.config.apiSecret || '',
          },
        }
      );

      return response;
    } catch (error) {
      console.error('iPipeline status check error:', error);
      return null;
    }
  }

  /**
   * Generate mock quotes for development
   */
  private getMockQuotes(request: IPipelineQuoteRequest): IPipelineQuoteResponse {
    const { applicant, product } = request;
    const baseMonthlyPremium = this.calculateBasePremium(applicant.age, product.faceAmount);

    const carriers = [
      {
        name: 'Protective Life',
        code: 'PROT',
        rating: 'A+',
        multiplier: 0.85,
      },
      {
        name: 'Prudential',
        code: 'PRUD',
        rating: 'AA+',
        multiplier: 0.95,
      },
      {
        name: 'Lincoln Financial',
        code: 'LINC',
        rating: 'A+',
        multiplier: 0.90,
      },
      {
        name: 'Banner Life',
        code: 'BANN',
        rating: 'A+',
        multiplier: 0.88,
      },
      {
        name: 'AIG',
        code: 'AIG',
        rating: 'A',
        multiplier: 1.00,
      },
    ];

    const quotes: IPipelineQuote[] = carriers.map((carrier, index) => {
      const monthlyPremium = Math.round(baseMonthlyPremium * carrier.multiplier * 100) / 100;
      const annualPremium = Math.round(monthlyPremium * 12 * 100) / 100;
      const totalPremium = Math.round(annualPremium * product.term * 100) / 100;

      return {
        quoteId: `ipipe-${Date.now()}-${index}`,
        carrierName: carrier.name,
        carrierCode: carrier.code,
        productName: `${product.type} ${product.term}-Year`,
        productType: product.type,
        monthlyPremium,
        annualPremium,
        totalPremium,
        faceAmount: product.faceAmount,
        term: product.term,
        carrierRating: carrier.rating,
        ratingAgency: 'AM Best',
        features: {
          returnOfPremium: product.type === 'ROP',
          convertible: product.type === 'Convertible Term' || index % 2 === 0,
          renewableToAge: product.term >= 20 ? 95 : null,
          acceleratedDeathBenefit: true,
          waiverOfPremium: index < 3,
          terminalIllnessRider: true,
          childRider: index % 2 === 0,
        },
        underwritingClass: applicant.healthClass,
        quoteDate: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        applicationUrl: `https://mock.ipipeline.com/apply/${carrier.code}`,
        eAppAvailable: true,
      };
    });

    // Sort by monthly premium (best value first)
    quotes.sort((a, b) => a.monthlyPremium - b.monthlyPremium);

    const premiums = quotes.map((q) => q.monthlyPremium);

    return {
      success: true,
      quotes,
      requestId: `mock-${Date.now()}`,
      timestamp: new Date().toISOString(),
      metadata: {
        totalCarriers: quotes.length,
        averagePremium:
          Math.round((premiums.reduce((a, b) => a + b, 0) / premiums.length) * 100) / 100,
        lowestPremium: Math.min(...premiums),
        highestPremium: Math.max(...premiums),
      },
    };
  }

  /**
   * Calculate base premium (simplified calculation for mock data)
   */
  private calculateBasePremium(age: number, faceAmount: number): number {
    // Base rate per $1,000 of coverage
    const baseRate = 0.08;

    // Age factor (increases with age)
    const ageFactor = 1 + (age - 30) * 0.02;

    // Calculate premium per $1,000
    const premiumPer1000 = baseRate * ageFactor;

    // Calculate total monthly premium
    const monthlyPremium = (faceAmount / 1000) * premiumPer1000;

    return Math.round(monthlyPremium * 100) / 100;
  }

  /**
   * Health check for iPipeline API
   */
  async healthCheck() {
    if (!this.config.enabled) {
      return {
        healthy: false,
        message: 'iPipeline integration is disabled',
        lastChecked: new Date(),
      };
    }

    if (!this.config.apiKey || !this.config.apiSecret) {
      return {
        healthy: false,
        message: 'iPipeline API credentials not configured',
        lastChecked: new Date(),
      };
    }

    try {
      // Try to make a simple health check request
      await this.request('/health', {
        method: 'GET',
        headers: {
          'X-API-Key': this.config.apiKey,
          'X-API-Secret': this.config.apiSecret,
        },
      });

      return {
        healthy: true,
        message: 'iPipeline API is operational',
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        healthy: false,
        message: 'iPipeline API health check failed',
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const iPipelineClient = new IPipelineClient();
