/**
 * RateWatch API Client
 * Provides annuity rate comparison and product information
 */

import { BaseIntegration } from '../base-integration';
import { rateWatchConfig } from '../config';
import type {
  RateWatchQuoteRequest,
  RateWatchQuoteResponse,
  RateWatchQuote,
  RateWatchCarrier,
  RateWatchProduct,
  RateWatchHistoricalData,
  RateWatchComparisonRequest,
} from './types';
import { AnnuityType, AnnuityTerm } from './types';

export class RateWatchClient extends BaseIntegration {
  get name(): string {
    return 'RateWatch';
  }

  get baseUrl(): string {
    return this.config.baseUrl || 'https://api.ratewatch.com/v1';
  }

  constructor() {
    super(rateWatchConfig);
  }

  /**
   * Get annuity rate quotes
   */
  async getQuotes(
    request: RateWatchQuoteRequest
  ): Promise<RateWatchQuoteResponse> {
    // For development: return mock data if API is not enabled
    if (!this.config.enabled || !this.config.apiKey) {
      console.log('[RATEWATCH_MOCK] Returning mock quote data');
      return this.getMockQuotes(request);
    }

    try {
      const response = await this.request<RateWatchQuoteResponse>(
        '/annuity/quotes',
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
      console.error('RateWatch API error:', error);
      return {
        success: false,
        quotes: [],
        requestId: `error-${Date.now()}`,
        metadata: {
          totalResults: 0,
          averageRate: 0,
          bestRate: 0,
          requestDate: new Date().toISOString(),
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get carrier information
   */
  async getCarrier(carrierId: string): Promise<RateWatchCarrier | null> {
    if (!this.config.enabled || !this.config.apiKey) {
      return null;
    }

    try {
      const response = await this.request<RateWatchCarrier>(
        `/carriers/${carrierId}`,
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
      console.error('RateWatch carrier lookup error:', error);
      return null;
    }
  }

  /**
   * Get product details
   */
  async getProduct(productId: string): Promise<RateWatchProduct | null> {
    if (!this.config.enabled || !this.config.apiKey) {
      return null;
    }

    try {
      const response = await this.request<RateWatchProduct>(
        `/products/${productId}`,
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
      console.error('RateWatch product lookup error:', error);
      return null;
    }
  }

  /**
   * Get historical rate data for a product
   */
  async getHistoricalRates(
    productId: string,
    startDate?: string,
    endDate?: string
  ): Promise<RateWatchHistoricalData | null> {
    if (!this.config.enabled || !this.config.apiKey) {
      return null;
    }

    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await this.request<RateWatchHistoricalData>(
        `/products/${productId}/history?${params.toString()}`,
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
      console.error('RateWatch historical data error:', error);
      return null;
    }
  }

  /**
   * Compare multiple annuity products
   */
  async compareProducts(
    request: RateWatchComparisonRequest
  ): Promise<RateWatchQuoteResponse> {
    if (!this.config.enabled || !this.config.apiKey) {
      console.log('[RATEWATCH_MOCK] Returning mock comparison data');
      return this.getMockQuotes(request);
    }

    try {
      const response = await this.request<RateWatchQuoteResponse>(
        '/annuity/compare',
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
      console.error('RateWatch comparison error:', error);
      return {
        success: false,
        quotes: [],
        requestId: `error-${Date.now()}`,
        metadata: {
          totalResults: 0,
          averageRate: 0,
          bestRate: 0,
          requestDate: new Date().toISOString(),
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate mock quotes for development
   */
  private getMockQuotes(
    request: RateWatchQuoteRequest | RateWatchComparisonRequest
  ): RateWatchQuoteResponse {
    const mockCarriers = [
      { name: 'American National', rating: 'A', baseRate: 5.25 },
      { name: 'Athene', rating: 'A', baseRate: 5.40 },
      { name: 'Great American', rating: 'A+', baseRate: 5.15 },
      { name: 'Midland National', rating: 'A+', baseRate: 5.50 },
      { name: 'North American', rating: 'A+', baseRate: 5.35 },
      { name: 'Pacific Life', rating: 'A+', baseRate: 5.20 },
    ];

    const term = request.term || AnnuityTerm.FIVE_YEAR;
    const premium = request.premium;

    const quotes: RateWatchQuote[] = mockCarriers.map((carrier, index) => {
      const guaranteedRate = carrier.baseRate + (term - 3) * 0.1;
      const currentRate = guaranteedRate + 0.25;
      const accumulatedValue =
        premium * Math.pow(1 + guaranteedRate / 100, term);
      const totalInterest = accumulatedValue - premium;

      return {
        carrierId: `carrier-${index + 1}`,
        carrierName: carrier.name,
        carrierRating: carrier.rating,
        productName: `${term}-Year ${request.annuityType === AnnuityType.MYGA ? 'MYGA' : 'Fixed Annuity'}`,
        productId: `product-${index + 1}`,
        annuityType: request.annuityType,
        guaranteedRate,
        currentRate,
        term,
        surrenderPeriod: term,
        minimumPremium: 10000,
        maximumPremium: 1000000,
        minimumAge: 0,
        maximumAge: 85,
        features: {
          deathBenefit: true,
          nursingHomeBenefit: index % 2 === 0,
          terminalIllnessBenefit: index % 3 === 0,
          freeWithdrawal: true,
          freeWithdrawalPercentage: 10,
          bailoutProvision: index % 2 === 0,
          marketValueAdjustment: index % 3 !== 0,
        },
        surrenderSchedule: Array.from({ length: term }, (_, year) => ({
          year: year + 1,
          chargePercentage: Math.max(0, term - year - 1),
        })),
        statesAvailable: ['CA', 'TX', 'FL', 'NY', 'IL'],
        qualified: true,
        nonQualified: true,
        effectiveDate: new Date().toISOString(),
        expirationDate: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        lastUpdated: new Date().toISOString(),
        accumulatedValue,
        totalInterest,
      };
    });

    // Sort by guaranteed rate (highest first)
    quotes.sort((a, b) => b.guaranteedRate - a.guaranteedRate);

    const rates = quotes.map((q) => q.guaranteedRate);
    const averageRate = rates.reduce((a, b) => a + b, 0) / rates.length;
    const bestRate = Math.max(...rates);

    return {
      success: true,
      quotes,
      requestId: `mock-${Date.now()}`,
      metadata: {
        totalResults: quotes.length,
        averageRate,
        bestRate,
        requestDate: new Date().toISOString(),
      },
    };
  }
}

/**
 * Export singleton instance
 */
export const rateWatchClient = new RateWatchClient();
