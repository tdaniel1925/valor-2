/**
 * Quote Aggregation Service
 * Aggregates quotes from multiple providers (WinFlex, iPipeline, RateWatch)
 * and provides unified quoting functionality
 */

import { winFlexClient } from './winflex/client';
import { iPipelineClient } from './ipipeline/client';
import { rateWatchClient } from './ratewatch/client';
import type { WinFlexQuoteRequest } from './winflex/types';
import type { IPipelineQuoteRequest } from './ipipeline/types';
import type { RateWatchQuoteRequest } from './ratewatch/types';
import { AnnuityType } from './ratewatch/types';

export interface UnifiedQuoteRequest {
  // Client information
  clientInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'Male' | 'Female';
    state: string;
    zipCode: string;
    email?: string;
    phone?: string;
  };

  // Health information
  healthInfo: {
    tobacco: 'Never' | 'Former' | 'Current';
    healthClass: 'Preferred Plus' | 'Preferred' | 'Standard Plus' | 'Standard' | 'Substandard';
    height: number; // in inches
    weight: number; // in pounds
  };

  // Product details
  product: {
    type: 'Term' | 'Whole Life' | 'Universal Life' | 'Variable Universal Life' | 'Annuity';
    faceAmount?: number; // For life insurance
    premium?: number; // For annuities
    term?: number; // For term life
    annuityType?: 'FIXED' | 'VARIABLE' | 'INDEXED' | 'IMMEDIATE' | 'DEFERRED';
  };

  // Optional filters
  filters?: {
    carriers?: string[];
    minRating?: string;
    maxPremium?: number;
  };
}

export interface UnifiedQuote {
  id: string;
  provider: 'WinFlex' | 'iPipeline' | 'RateWatch';
  carrierId: string;
  carrierName: string;
  productId: string;
  productName: string;
  productType: string;

  // Pricing (normalized)
  monthlyPremium?: number;
  annualPremium?: number;
  rate?: number; // For annuities

  // Coverage details
  faceAmount?: number;
  term?: number;
  guaranteedYears?: number;

  // Rating information
  carrierRating?: string;
  ratingAgency?: string;

  // Features
  features: Record<string, boolean | string | number | null>;

  // Metadata
  quoteDate: string;
  expirationDate: string;
  applicationUrl?: string;
  eAppAvailable?: boolean;
}

export interface AggregatedQuotesResponse {
  success: boolean;
  quotes: UnifiedQuote[];
  providers: {
    winFlex: { success: boolean; count: number; error?: string };
    iPipeline: { success: boolean; count: number; error?: string };
    rateWatch: { success: boolean; count: number; error?: string };
  };
  metadata: {
    totalQuotes: number;
    bestQuote?: UnifiedQuote;
    averagePremium?: number;
    requestTime: number; // milliseconds
  };
  requestId: string;
  timestamp: string;
}

export class QuoteAggregator {
  /**
   * Get quotes from all available providers
   */
  async getAggregatedQuotes(
    request: UnifiedQuoteRequest
  ): Promise<AggregatedQuotesResponse> {
    const startTime = Date.now();
    const requestId = `AGG-${startTime}`;

    const allQuotes: UnifiedQuote[] = [];
    const providers = {
      winFlex: { success: false, count: 0, error: undefined as string | undefined },
      iPipeline: { success: false, count: 0, error: undefined as string | undefined },
      rateWatch: { success: false, count: 0, error: undefined as string | undefined },
    };

    // Calculate age from date of birth
    const age = this.calculateAge(request.clientInfo.dateOfBirth);

    // Parallel quote requests
    const results = await Promise.allSettled([
      // WinFlex - For all life insurance products
      request.product.type !== 'Annuity' ? this.getWinFlexQuotes(request, age) : null,

      // iPipeline - Best for term life insurance
      request.product.type === 'Term' ? this.getIPipelineQuotes(request, age) : null,

      // RateWatch - For annuities
      request.product.type === 'Annuity' ? this.getRateWatchQuotes(request, age) : null,
    ]);

    // Process WinFlex results
    if (results[0].status === 'fulfilled' && results[0].value) {
      const winFlexResult = results[0].value;
      if (winFlexResult.success) {
        providers.winFlex.success = true;
        providers.winFlex.count = winFlexResult.quotes.length;
        allQuotes.push(...winFlexResult.quotes);
      } else {
        providers.winFlex.error = winFlexResult.error;
      }
    }

    // Process iPipeline results
    if (results[1].status === 'fulfilled' && results[1].value) {
      const iPipelineResult = results[1].value;
      if (iPipelineResult.success) {
        providers.iPipeline.success = true;
        providers.iPipeline.count = iPipelineResult.quotes.length;
        allQuotes.push(...iPipelineResult.quotes);
      } else {
        providers.iPipeline.error = iPipelineResult.error;
      }
    }

    // Process RateWatch results
    if (results[2].status === 'fulfilled' && results[2].value) {
      const rateWatchResult = results[2].value;
      if (rateWatchResult.success) {
        providers.rateWatch.success = true;
        providers.rateWatch.count = rateWatchResult.quotes.length;
        allQuotes.push(...rateWatchResult.quotes);
      } else {
        providers.rateWatch.error = rateWatchResult.error;
      }
    }

    // Apply filters
    let filteredQuotes = allQuotes;
    if (request.filters) {
      if (request.filters.carriers && request.filters.carriers.length > 0) {
        filteredQuotes = filteredQuotes.filter((q) =>
          request.filters!.carriers!.includes(q.carrierId)
        );
      }
      if (request.filters.maxPremium) {
        filteredQuotes = filteredQuotes.filter(
          (q) =>
            !q.monthlyPremium || q.monthlyPremium <= request.filters!.maxPremium!
        );
      }
    }

    // Sort quotes by best value
    filteredQuotes.sort((a, b) => {
      if (a.monthlyPremium && b.monthlyPremium) {
        return a.monthlyPremium - b.monthlyPremium;
      }
      if (a.rate && b.rate) {
        return b.rate - a.rate; // Higher rate is better for annuities
      }
      return 0;
    });

    // Calculate metadata
    const bestQuote = filteredQuotes[0];
    const premiums = filteredQuotes
      .filter((q) => q.monthlyPremium)
      .map((q) => q.monthlyPremium!);
    const averagePremium =
      premiums.length > 0
        ? Math.round((premiums.reduce((a, b) => a + b, 0) / premiums.length) * 100) / 100
        : undefined;

    return {
      success: true,
      quotes: filteredQuotes,
      providers,
      metadata: {
        totalQuotes: filteredQuotes.length,
        bestQuote,
        averagePremium,
        requestTime: Date.now() - startTime,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get quotes from WinFlex
   */
  private async getWinFlexQuotes(request: UnifiedQuoteRequest, age: number) {
    try {
      const winFlexRequest: WinFlexQuoteRequest = {
        applicant: {
          age,
          gender: request.clientInfo.gender,
          state: request.clientInfo.state,
          tobacco: request.healthInfo.tobacco,
          healthClass: request.healthInfo.healthClass,
        },
        product: {
          type: request.product.type as any,
          faceAmount: request.product.faceAmount!,
          term: request.product.term,
        },
        carriers: request.filters?.carriers,
      };

      const response = await winFlexClient.getQuotes(winFlexRequest);

      return {
        success: response.success,
        error: response.message,
        quotes: response.quotes.map((q) => this.normalizeWinFlexQuote(q)),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'WinFlex request failed',
        quotes: [],
      };
    }
  }

  /**
   * Get quotes from iPipeline
   */
  private async getIPipelineQuotes(request: UnifiedQuoteRequest, age: number) {
    try {
      const iPipelineRequest: IPipelineQuoteRequest = {
        applicant: {
          age,
          gender: request.clientInfo.gender,
          state: request.clientInfo.state,
          tobacco: request.healthInfo.tobacco,
          healthClass: request.healthInfo.healthClass as any,
        },
        product: {
          type: 'Term',
          faceAmount: request.product.faceAmount!,
          term: request.product.term!,
        },
      };

      const response = await iPipelineClient.getTermQuotes(iPipelineRequest);

      return {
        success: response.success,
        error: response.error,
        quotes: response.quotes.map((q) => this.normalizeIPipelineQuote(q)),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'iPipeline request failed',
        quotes: [],
      };
    }
  }

  /**
   * Get quotes from RateWatch
   */
  private async getRateWatchQuotes(request: UnifiedQuoteRequest, age: number) {
    try {
      // Map string annuity type to AnnuityType enum
      const annuityTypeMap: Record<string, AnnuityType> = {
        'FIXED': AnnuityType.FIXED,
        'VARIABLE': AnnuityType.VARIABLE,
        'INDEXED': AnnuityType.FIXED_INDEXED,
        'IMMEDIATE': AnnuityType.IMMEDIATE,
        'DEFERRED': AnnuityType.DEFERRED,
      };

      const rateWatchRequest: RateWatchQuoteRequest = {
        annuityType: annuityTypeMap[request.product.annuityType!] || AnnuityType.FIXED,
        premium: request.product.premium!,
        term: request.product.term,
        state: request.clientInfo.state,
        age,
        qualified: true, // Default to qualified
      };

      const response = await rateWatchClient.getQuotes(rateWatchRequest);

      return {
        success: response.success,
        error: response.error,
        quotes: response.quotes.map((q) => this.normalizeRateWatchQuote(q)),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'RateWatch request failed',
        quotes: [],
      };
    }
  }

  /**
   * Normalize WinFlex quote to unified format
   */
  private normalizeWinFlexQuote(quote: any): UnifiedQuote {
    return {
      id: quote.quoteId,
      provider: 'WinFlex',
      carrierId: quote.carrierId,
      carrierName: quote.carrierName,
      productId: quote.productId,
      productName: quote.productName,
      productType: quote.productName,
      monthlyPremium: quote.monthlyPremium,
      annualPremium: quote.annualPremium,
      faceAmount: quote.faceAmount,
      term: quote.term,
      guaranteedYears: quote.guaranteedYears,
      carrierRating: quote.ratings?.amBest,
      ratingAgency: 'AM Best',
      features: quote.features || {},
      quoteDate: quote.quoteDate,
      expirationDate: quote.expirationDate,
      eAppAvailable: false,
    };
  }

  /**
   * Normalize iPipeline quote to unified format
   */
  private normalizeIPipelineQuote(quote: any): UnifiedQuote {
    return {
      id: quote.quoteId,
      provider: 'iPipeline',
      carrierId: quote.carrierCode,
      carrierName: quote.carrierName,
      productId: `${quote.carrierCode}-${quote.productType}`,
      productName: quote.productName,
      productType: quote.productType,
      monthlyPremium: quote.monthlyPremium,
      annualPremium: quote.annualPremium,
      faceAmount: quote.faceAmount,
      term: quote.term,
      carrierRating: quote.carrierRating,
      ratingAgency: quote.ratingAgency,
      features: quote.features || {},
      quoteDate: quote.quoteDate,
      expirationDate: quote.expirationDate,
      applicationUrl: quote.applicationUrl,
      eAppAvailable: quote.eAppAvailable,
    };
  }

  /**
   * Normalize RateWatch quote to unified format
   */
  private normalizeRateWatchQuote(quote: any): UnifiedQuote {
    return {
      id: quote.quoteId,
      provider: 'RateWatch',
      carrierId: quote.carrierCode,
      carrierName: quote.carrierName,
      productId: quote.productId,
      productName: quote.productName,
      productType: quote.annuityType,
      rate: quote.rate,
      guaranteedYears: quote.guaranteedYears,
      carrierRating: quote.carrierRating,
      ratingAgency: 'AM Best',
      features: {
        minimumPremium: quote.minimumPremium,
        maximumAge: quote.maximumAge,
        surrenderPeriod: quote.surrenderPeriod,
        ...quote.features,
      },
      quoteDate: quote.quoteDate,
      expirationDate: quote.expirationDate,
    };
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Get health status of all integration providers
   */
  async getProvidersHealth() {
    const [winFlexHealth, iPipelineHealth, rateWatchHealth] = await Promise.all([
      winFlexClient.healthCheck(),
      iPipelineClient.healthCheck(),
      rateWatchClient.healthCheck(),
    ]);

    return {
      winFlex: winFlexHealth,
      iPipeline: iPipelineHealth,
      rateWatch: rateWatchHealth,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const quoteAggregator = new QuoteAggregator();
