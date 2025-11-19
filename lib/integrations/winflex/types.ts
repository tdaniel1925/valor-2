/**
 * WinFlex API types for life insurance quoting
 */

export type ProductType = 'Term' | 'Whole Life' | 'Universal Life' | 'Variable Universal Life';

export type Gender = 'Male' | 'Female';

export type HealthClass =
  | 'Preferred Plus'
  | 'Preferred'
  | 'Standard Plus'
  | 'Standard'
  | 'Substandard';

export type TobaccoUse = 'Never' | 'Former' | 'Current';

export interface WinFlexQuoteRequest {
  applicant: {
    age: number;
    gender: Gender;
    state: string; // 2-letter state code
    tobacco: TobaccoUse;
    healthClass: HealthClass;
  };
  product: {
    type: ProductType;
    term?: number; // For term life: 10, 15, 20, 25, 30
    faceAmount: number; // Coverage amount
  };
  carriers?: string[]; // Optional: filter to specific carriers
}

export interface CarrierRating {
  amBest?: string; // A.M. Best rating (e.g., "A++", "A+", "A")
  sp?: string; // S&P rating
  moodys?: string; // Moody's rating
  fitch?: string; // Fitch rating
}

export interface WinFlexQuote {
  // Quote identification
  quoteId: string;
  carrierId: string;
  carrierName: string;
  productId: string;
  productName: string;

  // Pricing
  monthlyPremium: number;
  annualPremium: number;
  guaranteedYears: number;

  // Product details
  faceAmount: number;
  term?: number;

  // Carrier information
  ratings: CarrierRating;

  // Additional features
  features?: {
    convertible?: boolean;
    renewable?: boolean;
    livingBenefits?: boolean;
    acceleratedDeathBenefit?: boolean;
    waiverOfPremium?: boolean;
  };

  // Underwriting
  underwritingType: 'Full' | 'Simplified' | 'Guaranteed Issue';

  // Timestamps
  quoteDate: string;
  expirationDate: string;
}

export interface WinFlexQuoteResponse {
  success: boolean;
  quotes: WinFlexQuote[];
  message?: string;
  error?: string;
  requestId?: string;
}

export interface WinFlexCarrier {
  id: string;
  name: string;
  enabled: boolean;
  ratings: CarrierRating;
  products: string[];
}

export interface WinFlexProduct {
  id: string;
  name: string;
  carrierId: string;
  type: ProductType;
  minAge: number;
  maxAge: number;
  minFaceAmount: number;
  maxFaceAmount: number;
  availableTerms?: number[];
  features: string[];
}

// Mock data for development (until real API integration)
export const MOCK_CARRIERS: WinFlexCarrier[] = [
  {
    id: 'prudential',
    name: 'Prudential',
    enabled: true,
    ratings: { amBest: 'A+', sp: 'AA-', moodys: 'Aa3' },
    products: ['term', 'whole-life', 'universal-life'],
  },
  {
    id: 'pacific-life',
    name: 'Pacific Life',
    enabled: true,
    ratings: { amBest: 'A+', sp: 'A+', moodys: 'Aa3' },
    products: ['term', 'whole-life', 'universal-life'],
  },
  {
    id: 'nationwide',
    name: 'Nationwide',
    enabled: true,
    ratings: { amBest: 'A+', sp: 'AA-' },
    products: ['term', 'whole-life'],
  },
  {
    id: 'banner-life',
    name: 'Banner Life',
    enabled: true,
    ratings: { amBest: 'A+', sp: 'AA' },
    products: ['term'],
  },
  {
    id: 'aig',
    name: 'AIG',
    enabled: true,
    ratings: { amBest: 'A', sp: 'A' },
    products: ['term', 'universal-life'],
  },
];
