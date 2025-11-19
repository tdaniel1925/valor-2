/**
 * iPipeline API Integration Types
 * Term life insurance quotes and electronic applications
 */

export type Gender = 'Male' | 'Female';
export type TobaccoUse = 'Never' | 'Former' | 'Current';
export type HealthClass = 'Preferred Plus' | 'Preferred' | 'Standard' | 'Standard Plus';
export type ProductType = 'Term' | 'ROP' | 'Convertible Term';

/**
 * Quote request for iPipeline API
 */
export interface IPipelineQuoteRequest {
  applicant: {
    age: number;
    gender: Gender;
    state: string;
    tobacco: TobaccoUse;
    healthClass: HealthClass;
  };
  product: {
    type: ProductType;
    term: number; // e.g., 10, 15, 20, 25, 30 years
    faceAmount: number; // Coverage amount in dollars
  };
  options?: {
    includeROP?: boolean; // Return of Premium
    includeConvertible?: boolean; // Convertible options
  };
}

/**
 * Individual term life quote from iPipeline
 */
export interface IPipelineQuote {
  quoteId: string;
  carrierName: string;
  carrierCode: string;
  productName: string;
  productType: ProductType;

  // Pricing
  monthlyPremium: number;
  annualPremium: number;
  totalPremium: number; // Total over term

  // Coverage details
  faceAmount: number;
  term: number; // Years

  // Ratings
  carrierRating: string; // e.g., "A+", "AA"
  ratingAgency: string; // e.g., "AM Best"

  // Features
  features: {
    returnOfPremium: boolean;
    convertible: boolean;
    renewableToAge: number | null;
    acceleratedDeathBenefit: boolean;
    waiverOfPremium: boolean;
    terminalIllnessRider: boolean;
    childRider: boolean;
  };

  // Additional info
  underwritingClass: string;
  quoteDate: string; // ISO date
  expirationDate: string; // ISO date

  // Application
  applicationUrl?: string; // URL to start electronic application
  eAppAvailable: boolean;
}

/**
 * Response from iPipeline quote API
 */
export interface IPipelineQuoteResponse {
  success: boolean;
  quotes: IPipelineQuote[];
  requestId: string;
  timestamp: string;
  metadata?: {
    totalCarriers: number;
    averagePremium: number;
    lowestPremium: number;
    highestPremium: number;
  };
  error?: string;
}

/**
 * Electronic application request
 */
export interface IPipelineEAppRequest {
  quoteId: string;
  applicant: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string; // ISO date
    ssn?: string; // Optional, may be collected later
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  agent: {
    agentId: string;
    agentName: string;
    agentEmail: string;
    agentPhone?: string;
  };
  options?: {
    sendToClient?: boolean; // Email application link to client
    autoSave?: boolean; // Auto-save progress
  };
}

/**
 * Electronic application response
 */
export interface IPipelineEAppResponse {
  success: boolean;
  applicationId: string;
  applicationUrl: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'declined';
  message?: string;
  error?: string;
}

/**
 * Application status check
 */
export interface IPipelineApplicationStatus {
  applicationId: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'declined';
  carrierName: string;
  productName: string;
  faceAmount: number;
  applicantName: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  statusDetails?: string;
}
