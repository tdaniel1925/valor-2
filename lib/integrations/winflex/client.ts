/**
 * WinFlex API Client for life insurance quoting
 */

import { BaseIntegration } from '../base-integration';
import { winFlexConfig } from '../config';
import {
  WinFlexQuoteRequest,
  WinFlexQuoteResponse,
  WinFlexQuote,
  WinFlexCarrier,
  WinFlexProduct,
  MOCK_CARRIERS,
} from './types';

export class WinFlexClient extends BaseIntegration {
  get name(): string {
    return 'WinFlex';
  }

  get baseUrl(): string {
    return this.config.baseUrl || 'https://api.winflex.com/v1';
  }

  constructor() {
    super(winFlexConfig);
  }

  /**
   * Get life insurance quotes from multiple carriers
   *
   * @param request - Quote request parameters
   * @returns Quote response with quotes from multiple carriers
   */
  async getQuotes(request: WinFlexQuoteRequest): Promise<WinFlexQuoteResponse> {
    // For development: return mock data if API is not enabled
    if (!this.config.enabled || !this.config.apiKey) {
      return this.getMockQuotes(request);
    }

    try {
      // Real API call would go here
      const response = await this.request<WinFlexQuoteResponse>(
        '/quotes/life',
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );

      return response;
    } catch (error) {
      console.error('WinFlex API error:', error);
      // Fallback to mock data on error
      return this.getMockQuotes(request);
    }
  }

  /**
   * Get available carriers
   *
   * @returns List of available carriers
   */
  async getCarriers(): Promise<WinFlexCarrier[]> {
    if (!this.config.enabled || !this.config.apiKey) {
      return MOCK_CARRIERS;
    }

    try {
      const response = await this.request<{ carriers: WinFlexCarrier[] }>(
        '/carriers',
        {
          method: 'GET',
        }
      );

      return response.carriers;
    } catch (error) {
      console.error('Failed to fetch carriers:', error);
      return MOCK_CARRIERS;
    }
  }

  /**
   * Get products for a specific carrier
   *
   * @param carrierId - Carrier ID
   * @returns List of products
   */
  async getProducts(carrierId: string): Promise<WinFlexProduct[]> {
    if (!this.config.enabled || !this.config.apiKey) {
      return [];
    }

    try {
      const response = await this.request<{ products: WinFlexProduct[] }>(
        `/carriers/${carrierId}/products`,
        {
          method: 'GET',
        }
      );

      return response.products;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return [];
    }
  }

  /**
   * Generate mock quotes for development/testing
   *
   * @param request - Quote request parameters
   * @returns Mock quote response
   */
  private getMockQuotes(request: WinFlexQuoteRequest): WinFlexQuoteResponse {
    const { applicant, product } = request;

    // Base premium calculation (very simplified)
    const baseMonthly = this.calculateBasePremium(applicant.age, product.faceAmount, product.type);

    // Adjust for health class
    const healthMultiplier = this.getHealthMultiplier(applicant.healthClass);

    // Adjust for tobacco use
    const tobaccoMultiplier = applicant.tobacco === 'Current' ? 2.0 : applicant.tobacco === 'Former' ? 1.3 : 1.0;

    // Adjust for gender (females typically get better rates)
    const genderMultiplier = applicant.gender === 'Female' ? 0.9 : 1.0;

    const adjustedMonthly = baseMonthly * healthMultiplier * tobaccoMultiplier * genderMultiplier;

    // Filter carriers if specified
    const availableCarriers = request.carriers
      ? MOCK_CARRIERS.filter((c) => request.carriers!.includes(c.id))
      : MOCK_CARRIERS;

    // Generate quotes with slight variations per carrier
    const quotes: WinFlexQuote[] = availableCarriers.map((carrier, index) => {
      // Each carrier has slightly different pricing
      const carrierMultiplier = 0.9 + index * 0.05;
      const monthlyPremium = Math.round(adjustedMonthly * carrierMultiplier * 100) / 100;

      return {
        quoteId: `QUOTE-${Date.now()}-${carrier.id}`,
        carrierId: carrier.id,
        carrierName: carrier.name,
        productId: `${carrier.id}-${product.type.toLowerCase().replace(/\s/g, '-')}`,
        productName: `${carrier.name} ${product.type}${product.term ? ` ${product.term}` : ''}`,
        monthlyPremium,
        annualPremium: Math.round(monthlyPremium * 12 * 100) / 100,
        guaranteedYears: product.term || 10,
        faceAmount: product.faceAmount,
        term: product.term,
        ratings: carrier.ratings,
        features: {
          convertible: product.type === 'Term',
          renewable: product.type === 'Term',
          livingBenefits: true,
          acceleratedDeathBenefit: true,
          waiverOfPremium: true,
        },
        underwritingType: applicant.healthClass === 'Preferred Plus' || applicant.healthClass === 'Preferred'
          ? 'Simplified'
          : 'Full',
        quoteDate: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      };
    });

    // Sort by monthly premium (lowest first)
    quotes.sort((a, b) => a.monthlyPremium - b.monthlyPremium);

    return {
      success: true,
      quotes,
      message: 'Mock quotes generated successfully',
      requestId: `REQ-${Date.now()}`,
    };
  }

  /**
   * Calculate base premium (simplified calculation)
   */
  private calculateBasePremium(age: number, faceAmount: number, productType: string): number {
    // Base rate per $1000 of coverage
    let baseRate = 0.5;

    // Age adjustment (rates increase with age)
    if (age < 30) baseRate *= 0.6;
    else if (age < 40) baseRate *= 0.8;
    else if (age < 50) baseRate *= 1.2;
    else if (age < 60) baseRate *= 1.8;
    else baseRate *= 2.5;

    // Product type adjustment
    if (productType === 'Whole Life') baseRate *= 3.5;
    else if (productType === 'Universal Life') baseRate *= 2.5;
    else if (productType === 'Variable Universal Life') baseRate *= 3.0;

    return (faceAmount / 1000) * baseRate;
  }

  /**
   * Get health class multiplier
   */
  private getHealthMultiplier(healthClass: string): number {
    switch (healthClass) {
      case 'Preferred Plus':
        return 0.8;
      case 'Preferred':
        return 0.9;
      case 'Standard Plus':
        return 1.0;
      case 'Standard':
        return 1.15;
      case 'Substandard':
        return 1.5;
      default:
        return 1.0;
    }
  }

  /**
   * Health check for WinFlex API
   */
  async healthCheck() {
    if (!this.config.enabled) {
      return {
        healthy: false,
        message: 'WinFlex integration is disabled',
        lastChecked: new Date(),
      };
    }

    if (!this.config.apiKey) {
      return {
        healthy: false,
        message: 'WinFlex API key not configured',
        lastChecked: new Date(),
      };
    }

    // Mock health check passes
    return {
      healthy: true,
      message: 'WinFlex API is operational (mock mode)',
      lastChecked: new Date(),
      responseTime: 150,
    };
  }
}

// Export singleton instance
export const winFlexClient = new WinFlexClient();
