/**
 * Type definitions for RateWatch API integration
 * RateWatch provides annuity rate comparison data
 */

/**
 * Annuity types supported by RateWatch
 */
export enum AnnuityType {
  FIXED = 'fixed',
  FIXED_INDEXED = 'fixed_indexed',
  VARIABLE = 'variable',
  IMMEDIATE = 'immediate',
  DEFERRED = 'deferred',
  MYGA = 'myga', // Multi-Year Guaranteed Annuity
}

/**
 * Annuity term lengths
 */
export enum AnnuityTerm {
  THREE_YEAR = 3,
  FIVE_YEAR = 5,
  SEVEN_YEAR = 7,
  TEN_YEAR = 10,
}

/**
 * Request for annuity rate quotes
 */
export interface RateWatchQuoteRequest {
  annuityType: AnnuityType;
  premium: number;
  term?: AnnuityTerm;
  state: string;
  age?: number;
  qualified?: boolean; // IRA/401k vs non-qualified
}

/**
 * Annuity rate quote from RateWatch
 */
export interface RateWatchQuote {
  carrierId: string;
  carrierName: string;
  carrierRating: string; // A.M. Best rating
  productName: string;
  productId: string;
  annuityType: AnnuityType;

  // Rate information
  guaranteedRate: number; // Annual percentage rate
  currentRate?: number; // May be higher than guaranteed

  // Terms
  term: number; // Years
  surrenderPeriod: number; // Years

  // Minimums and maximums
  minimumPremium: number;
  maximumPremium: number;
  minimumAge: number;
  maximumAge: number;

  // Features
  features: {
    deathBenefit: boolean;
    nursingHomeBenefit: boolean;
    terminalIllnessBenefit: boolean;
    freeWithdrawal: boolean;
    freeWithdrawalPercentage?: number;
    bailoutProvision: boolean;
    marketValueAdjustment: boolean;
  };

  // Surrender charges
  surrenderSchedule: {
    year: number;
    chargePercentage: number;
  }[];

  // Additional information
  statesAvailable: string[];
  qualified: boolean; // Available for IRA/401k
  nonQualified: boolean; // Available for non-qualified

  // Metadata
  effectiveDate: string;
  expirationDate: string;
  lastUpdated: string;

  // Calculated values
  accumulatedValue?: number; // Premium * rate over term
  totalInterest?: number;
}

/**
 * Response from RateWatch quote request
 */
export interface RateWatchQuoteResponse {
  success: boolean;
  quotes: RateWatchQuote[];
  requestId: string;
  metadata: {
    totalResults: number;
    averageRate: number;
    bestRate: number;
    requestDate: string;
  };
  error?: string;
}

/**
 * Carrier information from RateWatch
 */
export interface RateWatchCarrier {
  carrierId: string;
  carrierName: string;
  rating: string; // A.M. Best rating
  financialStrength: string;
  productsOffered: AnnuityType[];
  statesLicensed: string[];
  website?: string;
  contactPhone?: string;
}

/**
 * Product details from RateWatch
 */
export interface RateWatchProduct {
  productId: string;
  productName: string;
  carrierId: string;
  carrierName: string;
  annuityType: AnnuityType;
  description: string;
  highlights: string[];
  brochureUrl?: string;

  // Available terms
  availableTerms: number[];

  // Rate ranges
  rateRange: {
    minimum: number;
    maximum: number;
    current: number;
  };

  // Requirements
  minimumPremium: number;
  maximumPremium: number;
  minimumAge: number;
  maximumAge: number;

  statesAvailable: string[];
  effectiveDate: string;
  lastUpdated: string;
}

/**
 * Historical rate data
 */
export interface RateWatchHistoricalData {
  productId: string;
  productName: string;
  carrierName: string;
  history: {
    date: string;
    guaranteedRate: number;
    currentRate: number;
  }[];
}

/**
 * Rate comparison request
 */
export interface RateWatchComparisonRequest {
  annuityType: AnnuityType;
  premium: number;
  term: AnnuityTerm;
  state: string;
  age?: number;
  qualified?: boolean;

  // Filters
  minRate?: number;
  minCarrierRating?: string;
  includeCarriers?: string[];
  excludeCarriers?: string[];

  // Sorting
  sortBy?: 'rate' | 'carrier' | 'term';
  sortOrder?: 'asc' | 'desc';

  // Pagination
  limit?: number;
  offset?: number;
}

/**
 * Configuration for RateWatch API client
 */
export interface RateWatchConfig {
  apiKey: string;
  apiSecret?: string;
  baseUrl?: string;
  enabled: boolean;
  timeout?: number;
}

/**
 * Health check response
 */
export interface RateWatchHealthCheck {
  healthy: boolean;
  message: string;
  lastChecked: Date;
  dataLastUpdated?: string;
}
