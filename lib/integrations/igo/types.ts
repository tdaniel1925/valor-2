/**
 * Type definitions for iGO e-App API integration
 * iGO by iPipeline - Electronic insurance application submission
 */

/**
 * Application types supported by iGO
 */
export enum ApplicationType {
  TERM_LIFE = 'TERM_LIFE',
  WHOLE_LIFE = 'WHOLE_LIFE',
  UNIVERSAL_LIFE = 'UNIVERSAL_LIFE',
  INDEXED_UNIVERSAL_LIFE = 'INDEXED_UNIVERSAL_LIFE',
  VARIABLE_LIFE = 'VARIABLE_LIFE',
}

/**
 * Application status
 */
export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  IN_UNDERWRITING = 'IN_UNDERWRITING',
  PENDING_REQUIREMENTS = 'PENDING_REQUIREMENTS',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  WITHDRAWN = 'WITHDRAWN',
  ISSUED = 'ISSUED',
}

/**
 * Applicant information
 */
export interface IGoApplicant {
  // Personal Information
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  ssn: string;
  dateOfBirth: string; // ISO date
  gender: 'Male' | 'Female';

  // Contact Information
  email: string;
  phone: string;

  // Address
  address: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };

  // Employment
  occupation?: string;
  employer?: string;
  employmentStatus?: 'Employed' | 'Self-Employed' | 'Retired' | 'Unemployed';

  // Health Information
  height: {
    feet: number;
    inches: number;
  };
  weight: number;
  tobacco: 'Never' | 'Former' | 'Current';
  tobaccoYearsSince?: number; // For former users

  // Existing Coverage
  existingInsurance?: {
    carrier: string;
    policyNumber: string;
    faceAmount: number;
    replacement?: boolean;
  }[];
}

/**
 * Beneficiary information
 */
export interface IgoBeneficiary {
  type: 'Primary' | 'Contingent';
  relationship: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  ssn?: string;
  percentage: number; // 0-100
  address?: {
    street1: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

/**
 * Owner information (if different from applicant)
 */
export interface IgoOwner {
  type: 'Individual' | 'Trust' | 'Business';
  firstName?: string;
  lastName?: string;
  businessName?: string;
  ssn?: string;
  ein?: string;
  address: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

/**
 * Payment information
 */
export interface IgoPayment {
  mode: 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual';
  method: 'ACH' | 'Credit Card' | 'Check' | 'Wire';

  // ACH details
  bankName?: string;
  accountType?: 'Checking' | 'Savings';
  routingNumber?: string;
  accountNumber?: string;

  // Credit card details
  cardNumber?: string;
  expirationDate?: string;
  cvv?: string;

  // Premium
  modalPremium: number;
  annualPremium: number;
}

/**
 * Create application request
 */
export interface IGoApplicationRequest {
  // Product Information
  carrierId: string;
  carrierName: string;
  productId: string;
  productName: string;
  productType: ApplicationType;
  faceAmount: number;
  term?: number;

  // Applicant & Related Parties
  applicant: IGoApplicant;
  owner?: IgoOwner;
  beneficiaries: IgoBeneficiary[];

  // Payment
  payment: IgoPayment;

  // Additional Information
  replacementForms?: boolean;
  hipaaAuthorization: boolean;
  electronicConsent: boolean;

  // Agent Information
  agentId: string;
  agentEmail?: string;
  agentLicenseNumber?: string;
  agentNPN?: string;

  // References
  quoteId?: string; // Internal quote reference
  externalQuoteId?: string; // Quote from quoting system
}

/**
 * Application response
 */
export interface IGoApplicationResponse {
  success: boolean;
  applicationId?: string;
  confirmationNumber?: string;
  status: ApplicationStatus;

  // Application URLs
  applicationUrl?: string; // URL to view/edit application
  eSignUrl?: string; // URL for e-signature

  // Requirements
  requirements?: {
    type: string;
    description: string;
    status: 'Pending' | 'Completed' | 'Waived';
  }[];

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
export interface IGoStatusRequest {
  applicationId: string;
}

/**
 * Application status response
 */
export interface IGoStatusResponse {
  success: boolean;
  applicationId: string;
  status: ApplicationStatus;
  statusDate: string;
  statusNotes?: string;

  // Underwriting
  underwritingDecision?: 'Approved Standard' | 'Approved Rated' | 'Declined' | 'Postponed';
  rating?: string;
  ratingDetails?: string;

  // Requirements
  requirements?: {
    id: string;
    type: string;
    description: string;
    status: 'Pending' | 'Completed' | 'Waived';
    dueDate?: string;
    completedDate?: string;
  }[];

  // Policy Information (if issued)
  policyNumber?: string;
  issueDate?: string;
  effectiveDate?: string;

  error?: string;
}

/**
 * Submit requirement request
 */
export interface IGoSubmitRequirementRequest {
  applicationId: string;
  requirementId: string;
  documentType: string;
  documentUrl?: string;
  documentData?: string; // Base64 encoded
  notes?: string;
}

/**
 * Pre-fill application from quote
 */
export interface IgoPrefillRequest {
  quoteId: string;
  applicant?: Partial<IGoApplicant>;
  beneficiaries?: Partial<IgoBeneficiary>[];
}

/**
 * E-signature request
 */
export interface IGoESignatureRequest {
  applicationId: string;
  signerEmail: string;
  signerName: string;
  returnUrl?: string;
}

/**
 * E-signature response
 */
export interface IGoESignatureResponse {
  success: boolean;
  sessionId?: string;
  signatureUrl?: string;
  expiresAt?: string;
  error?: string;
}

/**
 * Configuration for iGO API client
 */
export interface IGoConfig {
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
    prefillFromQuote?: boolean;
    emailValidation?: boolean;
    physicianLookup?: boolean;
    bankVerification?: boolean;
  };
}

/**
 * Health check response
 */
export interface IGoHealthCheck {
  healthy: boolean;
  message: string;
  lastChecked: Date;
  environment?: string;
  version?: string;
}

/**
 * Webhook event types
 */
export enum IGoWebhookEvent {
  APPLICATION_SUBMITTED = 'application.submitted',
  APPLICATION_APPROVED = 'application.approved',
  APPLICATION_DECLINED = 'application.declined',
  APPLICATION_ISSUED = 'application.issued',
  REQUIREMENT_RECEIVED = 'requirement.received',
  REQUIREMENT_COMPLETED = 'requirement.completed',
  STATUS_CHANGE = 'status.change',
  ESIGNATURE_COMPLETED = 'esignature.completed',
}
