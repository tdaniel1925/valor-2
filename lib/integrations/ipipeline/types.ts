/**
 * iPipeline API Integration Types
 * Term life insurance quotes, electronic applications, and SAML 2.0 SSO
 *
 * Based on Valor Insurance SAML2 Guide (GAID: 2717)
 */

// ============================================
// SAML 2.0 SSO Types
// ============================================

// iPipeline product types for SSO
export type IPipelineProduct = 'igo' | 'lifepipe' | 'formspipe' | 'xrae' | 'productinfo';

// Environment type
export type IPipelineEnvironment = 'uat' | 'production';

// iPipeline SSO configuration
export interface IPipelineConfig {
  // Valor-specific identifiers (assigned by iPipeline)
  gaid: string;           // 2717
  companyIdentifier: string; // 2717
  channelName: string;    // VAL
  groups: string;         // 02717-UsersGroup

  // Certificate configuration
  privateKey: string;
  certificate: string;

  // IdP configuration
  entityId: string;

  // Environment
  environment: IPipelineEnvironment;
}

// SSO request for launching iPipeline products
export interface IPipelineSSORequest {
  // User identification
  userId: string;

  // User profile data
  firstName: string;
  lastName: string;
  email: string;

  // Optional user data
  middleName?: string;
  phone?: string;
  phone2?: string;
  fax?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  brokerDealerNum?: string;

  // Which iPipeline product to launch
  product: IPipelineProduct;

  // Optional client data (for iGO)
  clientData?: IPipelineClientData;
}

// Client data for iGO applications
export interface IPipelineClientData {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  dateOfBirth?: string;
  gender?: string;
  ssn?: string;
  email?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

// SAML Response structure
export interface SAMLResponseData {
  samlResponse: string;  // Base64 encoded SAML XML
  relayState: string;    // Destination URL
  acsUrl: string;        // Assertion Consumer Service URL
}

// iPipeline endpoints configuration
export const IPIPELINE_ENDPOINTS = {
  // Assertion Consumer Service URLs
  acs: {
    uat: 'https://federate-uat.ipipeline.com/sp/ACS.saml2',
    production: 'https://federate.ipipeline.com/sp/ACS.saml2',
  },

  // Single Logout Service URLs
  slo: {
    uat: 'https://federate-uat.ipipeline.com/sp/SLO.saml2',
    production: 'https://federate.ipipeline.com/sp/SLO.saml2',
  },

  // RelayState URLs (product-specific, GAID=2717 for Valor)
  products: {
    igo: {
      uat: 'https://pipepasstoigo-uat3.ipipeline.com/default.aspx?gaid=2717',
      production: 'https://pipepasstoigo.ipipeline.com/default.aspx?gaid=2717',
    },
    lifepipe: {
      uat: 'https://quote-uat.ipipeline.com/LTSearch.aspx?GAID=2717',
      production: 'https://quote.ipipeline.com/LTSearch.aspx?GAID=2717',
    },
    formspipe: {
      uat: 'https://formspipe-uat.ipipeline.com/?GAID=2717',
      production: 'https://formspipe.ipipeline.com/?GAID=2717',
    },
    xrae: {
      uat: 'https://xrae-uat.ipipeline.com/RSAGateway?gaid=2717',
      production: 'https://xrae.ipipeline.com/RSAGateway?gaid=2717',
    },
    productinfo: {
      uat: 'https://prodinfo-uat.ipipeline.com/productlist?GAID=2717',
      production: 'https://prodinfo.ipipeline.com/productlist?GAID=2717',
    },
  },

  // SP Entity IDs
  spEntityId: {
    uat: 'federate-uat.ipipeline.com:saml2',
    production: 'federate.ipipeline.com:saml2',
  },
};

// Product display information
export const IPIPELINE_PRODUCTS_INFO: Record<IPipelineProduct, {
  name: string;
  description: string;
  icon: string;
}> = {
  igo: {
    name: 'iGO',
    description: 'Life Insurance E-Applications',
    icon: 'FileText',
  },
  lifepipe: {
    name: 'LifePipe',
    description: 'Term Life Quoting',
    icon: 'Calculator',
  },
  formspipe: {
    name: 'FormsPipe',
    description: 'Insurance Forms',
    icon: 'FileCheck',
  },
  xrae: {
    name: 'XRAE',
    description: 'Risk Assessment Engine',
    icon: 'Shield',
  },
  productinfo: {
    name: 'Product Info',
    description: 'Product Catalog',
    icon: 'Info',
  },
};

// ============================================
// Quote API Types (existing)
// ============================================

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
