/**
 * Type definitions for FireLight API integration
 * FireLight by Hexure - Annuity application submission
 */

/**
 * Annuity types supported by FireLight
 */
export enum FireLightAnnuityType {
  FIXED = 'FIXED',
  FIXED_INDEXED = 'FIXED_INDEXED',
  VARIABLE = 'VARIABLE',
  RILA = 'RILA', // Registered Index-Linked Annuity
  IMMEDIATE = 'IMMEDIATE',
  DEFERRED = 'DEFERRED',
  MYGA = 'MYGA', // Multi-Year Guaranteed Annuity
}

/**
 * Application status
 */
export enum FireLightApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  ISSUED = 'ISSUED',
  CANCELLED = 'CANCELLED',
}

/**
 * Annuitant information
 */
export interface FireLightAnnuitant {
  // Personal Information
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  ssn: string;
  dateOfBirth: string; // ISO date
  gender: 'Male' | 'Female';
  citizenshipStatus: 'US Citizen' | 'Resident Alien' | 'Non-Resident Alien';

  // Contact Information
  email: string;
  phone: string;
  phoneType?: 'Mobile' | 'Home' | 'Work';

  // Address
  address: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };

  // Employment & Financial
  occupation?: string;
  employer?: string;
  employmentStatus?: 'Employed' | 'Self-Employed' | 'Retired' | 'Unemployed';
  annualIncome?: number;
  netWorth?: number;
  liquidNetWorth?: number;

  // Tax Information
  taxWithholding?: {
    federal: number; // Percentage
    state?: number; // Percentage
  };
}

/**
 * Owner information (if different from annuitant)
 */
export interface FireLightOwner {
  type: 'Individual' | 'Trust' | 'Business' | 'IRA' | '401K';

  // Individual
  firstName?: string;
  middleName?: string;
  lastName?: string;
  ssn?: string;
  dateOfBirth?: string;

  // Business/Trust
  businessName?: string;
  ein?: string;
  trustDate?: string;

  // Address
  address: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
  };

  // IRA/Qualified Plan Information
  qualifiedPlan?: {
    planType: 'Traditional IRA' | 'Roth IRA' | 'SEP IRA' | 'Simple IRA' | '401K' | '403B' | 'Other';
    custodian?: string;
    accountNumber?: string;
  };
}

/**
 * Beneficiary information
 */
export interface FireLightBeneficiary {
  type: 'Primary' | 'Contingent';
  designation: 'Individual' | 'Trust' | 'Estate' | 'Charity';

  // Individual
  firstName?: string;
  middleName?: string;
  lastName?: string;
  relationship?: string;
  dateOfBirth?: string;
  ssn?: string;

  // Trust/Entity
  entityName?: string;
  ein?: string;

  percentage: number; // 0-100

  address?: {
    street1: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

/**
 * Premium funding details
 */
export interface FireLightPremium {
  // Premium Amount
  initialPremium: number;
  additionalPremiums?: {
    amount: number;
    frequency?: 'One-Time' | 'Monthly' | 'Quarterly' | 'Annual';
  };

  // Source of Funds
  sourceOfFunds: 'Savings' | 'Investment Proceeds' | 'Inheritance' | 'Retirement Funds' | '1035 Exchange' | 'Other';
  sourceDetails?: string;

  // Payment Method
  paymentMethod: 'Check' | 'Wire Transfer' | 'ACH' | '1035 Exchange' | 'Rollover';

  // ACH Details
  bankName?: string;
  accountType?: 'Checking' | 'Savings';
  routingNumber?: string;
  accountNumber?: string;

  // 1035 Exchange Details
  exchange1035?: {
    existingCarrier: string;
    policyNumber: string;
    accountValue: number;
    surrenderValue: number;
    surrenderCharges?: number;
  };

  // IRA Rollover Details
  rollover?: {
    fromInstitution: string;
    accountNumber: string;
    accountValue: number;
    rolloverType: 'Direct' | 'Indirect';
  };
}

/**
 * Suitability information (required for annuities)
 */
export interface FireLightSuitability {
  // Investment Objective
  investmentObjective: 'Income' | 'Growth' | 'Balanced' | 'Preservation' | 'Speculation';
  investmentTimeHorizon: '1-3 years' | '4-7 years' | '8-10 years' | '10+ years';

  // Risk Tolerance
  riskTolerance: 'Conservative' | 'Moderate' | 'Aggressive';

  // Financial Situation
  liquidityNeeds: 'Immediate' | 'Short-Term' | 'Long-Term' | 'None';
  emergencyFunds: 'Yes' | 'No';
  otherInvestments: 'Yes' | 'No';

  // Existing Annuities
  existingAnnuities?: {
    carrier: string;
    productType: string;
    value: number;
    yearPurchased: number;
  }[];

  // Purpose
  purposeOfAnnuity: string;
  understandSurrenderCharges: boolean;
  understandLiquidityRestrictions: boolean;
}

/**
 * Create annuity application request
 */
export interface FireLightApplicationRequest {
  // Product Information
  carrierId: string;
  carrierName: string;
  productId: string;
  productName: string;
  annuityType: FireLightAnnuityType;

  // Parties
  annuitant: FireLightAnnuitant;
  owner: FireLightOwner;
  jointOwner?: FireLightOwner;
  beneficiaries: FireLightBeneficiary[];

  // Premium & Funding
  premium: FireLightPremium;

  // Suitability
  suitability: FireLightSuitability;

  // Additional Options
  options?: {
    deathBenefit?: 'Standard' | 'Enhanced' | 'Return of Premium' | 'Stepped Up';
    livingBenefit?: boolean;
    nursingHomeWaiver?: boolean;
    terminalIllnessWaiver?: boolean;
  };

  // Agent Information
  agentId: string;
  agentEmail?: string;
  agentLicenseNumber?: string;
  agentNPN?: string;

  // References
  quoteId?: string;
  externalQuoteId?: string;

  // Compliance
  replacementForm?: boolean;
  stateSpecificForms?: string[];
  electronicConsent: boolean;
}

/**
 * Application response
 */
export interface FireLightApplicationResponse {
  success: boolean;
  applicationId?: string;
  confirmationNumber?: string;
  status: FireLightApplicationStatus;

  // Application URLs
  applicationUrl?: string;
  eSignUrl?: string;
  reviewUrl?: string;

  // ACORD/DTCC Information
  acordXml?: string;
  dtccReferenceNumber?: string;

  // Messages
  message?: string;
  errors?: string[];
  warnings?: string[];

  // Metadata
  createdAt: string;
  submittedAt?: string;
  lastUpdatedAt?: string;
}

/**
 * Application status request
 */
export interface FireLightStatusRequest {
  applicationId: string;
}

/**
 * Application status response
 */
export interface FireLightStatusResponse {
  success: boolean;
  applicationId: string;
  status: FireLightApplicationStatus;
  statusDate: string;
  statusNotes?: string;

  // Contract Information (if issued)
  contractNumber?: string;
  issueDate?: string;
  effectiveDate?: string;
  contractValue?: number;

  // DTCC Status
  dtccStatus?: string;
  dtccStatusDate?: string;

  error?: string;
}

/**
 * E-signature request
 */
export interface FireLightESignatureRequest {
  applicationId: string;
  signers: {
    role: 'Annuitant' | 'Owner' | 'Agent';
    email: string;
    name: string;
  }[];
  returnUrl?: string;
}

/**
 * E-signature response
 */
export interface FireLightESignatureResponse {
  success: boolean;
  sessionId?: string;
  signatureUrls?: {
    role: string;
    url: string;
  }[];
  expiresAt?: string;
  error?: string;
}

/**
 * Submit 1035 exchange documentation
 */
export interface FireLight1035Request {
  applicationId: string;
  existingPolicyInfo: {
    carrier: string;
    policyNumber: string;
    policyType: string;
    accountValue: number;
    surrenderValue: number;
    costBasis?: number;
  };
  transferAuthorization: {
    signed: boolean;
    signedDate?: string;
    documentUrl?: string;
  };
}

/**
 * Configuration for FireLight API client
 */
export interface FireLightConfig {
  apiKey: string;
  apiSecret?: string;
  partnerId: string;
  baseUrl?: string;
  environment: 'sandbox' | 'production';
  enabled: boolean;
  timeout?: number;

  // Feature flags
  features?: {
    eSignature?: boolean;
    acordXml?: boolean;
    dtccIntegration?: boolean;
    suitabilityChecks?: boolean;
  };
}

/**
 * Health check response
 */
export interface FireLightHealthCheck {
  healthy: boolean;
  message: string;
  lastChecked: Date;
  environment?: string;
  version?: string;
}

/**
 * Webhook event types
 */
export enum FireLightWebhookEvent {
  APPLICATION_SUBMITTED = 'application.submitted',
  APPLICATION_APPROVED = 'application.approved',
  APPLICATION_DECLINED = 'application.declined',
  APPLICATION_ISSUED = 'application.issued',
  CONTRACT_DELIVERED = 'contract.delivered',
  STATUS_CHANGE = 'status.change',
  ESIGNATURE_COMPLETED = 'esignature.completed',
  EXCHANGE_1035_RECEIVED = 'exchange.1035.received',
}
