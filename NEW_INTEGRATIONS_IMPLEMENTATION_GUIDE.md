# New Integrations Implementation Guide

**For**: Integration Developers
**Date**: November 2024
**Project**: Valor Insurance Platform
**Version**: 1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Integration Architecture Pattern](#integration-architecture-pattern)
3. [Smart Office (3Mark/Zinnia) - Case Data Sync](#1-smart-office-3markzinnia---case-data-sync)
4. [SuranceBay - Contract Requests](#2-surancebay---contract-requests)
5. [iPipeline X-Ray - Underwriting Pre-Screen](#3-ipipeline-x-ray---underwriting-pre-screen)
6. [Libra - Underwriting Guidelines](#4-libra---underwriting-guidelines)
7. [GoHighLevel - Training and Community](#5-gohighlevel---training-and-community)
8. [Twilio - SMS Notifications](#6-twilio---sms-notifications)
9. [Calendly - Calendar Integration](#7-calendly---calendar-integration)
10. [Testing & Deployment](#testing--deployment)

---

## Overview

This document provides complete technical specifications for implementing 7 new third-party integrations in the Valor Insurance Platform. All integrations follow the existing architecture pattern established by WinFlex, iPipeline, RateWatch, iGO, and FireLight.

### Configuration Status

All 7 integrations have been **pre-configured** in the system:
- ✅ Configuration objects created in `lib/integrations/config.ts`
- ✅ Display names added to admin API at `app/api/admin/integrations/route.ts`
- ✅ Environment variable structure defined
- ✅ Ready to appear in admin UI (`/admin` page under Integrations)

### What Needs to Be Built

For each integration, you need to create:
1. **Type definitions** (`lib/integrations/[name]/types.ts`)
2. **Client implementation** (`lib/integrations/[name]/client.ts`)
3. **API routes** (`app/api/[feature]/route.ts`)
4. **Webhook handler** (if applicable) (`app/api/webhooks/[name]/route.ts`)

---

## Integration Architecture Pattern

All integrations follow this standardized structure:

### Directory Structure
```
lib/integrations/[integration-name]/
├── types.ts           # TypeScript interfaces and types
├── client.ts          # API client extending BaseIntegration
└── index.ts           # Public exports
```

### Base Integration Class

All clients **must extend** `BaseIntegration` from `lib/integrations/base-integration.ts`:

```typescript
import { BaseIntegration } from '../base-integration';
import { [name]Config } from '../config';

export class [Name]Client extends BaseIntegration {
  get name(): string {
    return '[Integration Name]';
  }

  get baseUrl(): string {
    return this.config.baseUrl || 'https://api.provider.com/v1';
  }

  constructor() {
    super([name]Config);
  }

  // Your implementation methods here
}

// Export singleton instance
export const [name]Client = new [Name]Client();
```

### What You Get From BaseIntegration

The `BaseIntegration` class provides:
- ✅ **Automatic retry logic** with exponential backoff
- ✅ **Request timeout handling** (configurable via env)
- ✅ **Audit logging** of all API calls
- ✅ **Error standardization** (`IntegrationError` format)
- ✅ **Health check** functionality
- ✅ **Authentication header** injection
- ✅ **Response parsing** and validation

### Protected Methods Available

```typescript
// Make authenticated API request with retry
protected async request<T>(
  endpoint: string,
  options?: RequestInit,
  retryOptions?: RetryOptions
): Promise<T>

// Get authentication headers (override if needed)
protected getAuthHeaders(): Record<string, string>

// Handle and standardize errors
protected handleError(error: unknown): IntegrationError

// Check API health
async healthCheck(): Promise<HealthCheckResult>
```

### Environment Variables Pattern

Each integration uses this pattern:
```env
[NAME]_ENABLED=true
[NAME]_API_KEY=your-api-key
[NAME]_API_SECRET=your-api-secret      # Optional
[NAME]_BASE_URL=https://api.provider.com/v1
[NAME]_TIMEOUT=30000
[NAME]_RETRY_ATTEMPTS=3
[NAME]_RETRY_DELAY=1000
```

---

## 1. Smart Office (3Mark/Zinnia) - Case Data Sync

### Purpose
Bidirectional synchronization of case data with 3Mark/Zinnia Smart Office CRM/agency management system.

### Business Value
- **Automatic case sync** - No manual data entry in Smart Office
- **Commission tracking** - Sync commission data from Smart Office
- **Client management** - Unified client database
- **Activity logging** - Track all client interactions
- **Reporting integration** - Pull production reports from Smart Office

### Provider Information
- **Company**: 3Mark (now Zinnia)
- **Website**: https://www.3markfs.com / https://www.zinnia.com
- **API Docs**: Available through Smart Office partner portal
- **Access**: Through FMO/BGA partnership or direct with Zinnia

### Configuration (Already Added)

**Location**: `lib/integrations/config.ts` (lines 87-95)

```typescript
export const smartOfficeConfig: IntegrationConfig = {
  enabled: process.env.SMART_OFFICE_ENABLED === 'true',
  apiKey: process.env.SMART_OFFICE_API_KEY,
  apiSecret: process.env.SMART_OFFICE_API_SECRET,
  baseUrl: process.env.SMART_OFFICE_BASE_URL || 'https://api.smartoffice.com/v1',
  timeout: Number(process.env.SMART_OFFICE_TIMEOUT) || 30000,
  retryAttempts: Number(process.env.SMART_OFFICE_RETRY_ATTEMPTS) || 3,
  retryDelay: Number(process.env.SMART_OFFICE_RETRY_DELAY) || 1000,
};
```

### Files to Create

#### 1. `lib/integrations/smart-office/types.ts`

```typescript
/**
 * Smart Office API types
 */

export interface SmartOfficeCase {
  caseId: string;
  caseNumber: string;
  clientId: string;
  clientName: string;
  productType: 'Life' | 'Annuity' | 'Long-Term Care' | 'Disability';
  carrier: string;
  product: string;
  faceAmount?: number;
  premium?: number;
  status: 'Pending' | 'Submitted' | 'Issued' | 'Declined' | 'Withdrawn';
  applicationDate: string;
  submissionDate?: string;
  issueDate?: string;
  policyNumber?: string;
  agentId: string;
  agentName: string;
  commissionLevel?: string;
  customFields?: Record<string, any>;
}

export interface SmartOfficeClient {
  clientId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
  };
  dateOfBirth?: string;
  ssn?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface SmartOfficeActivity {
  activityId: string;
  caseId?: string;
  clientId?: string;
  type: 'Call' | 'Email' | 'Meeting' | 'Note' | 'Task';
  subject: string;
  description?: string;
  date: string;
  agentId: string;
  completed: boolean;
}

export interface SmartOfficeCommission {
  commissionId: string;
  caseId: string;
  policyNumber: string;
  commissionType: 'First Year' | 'Renewal' | 'Trailer' | 'Override';
  amount: number;
  paymentDate: string;
  agentId: string;
  status: 'Pending' | 'Paid' | 'Adjusted' | 'Cancelled';
}

export interface SyncCaseRequest {
  valorCaseId: string;
  caseData: Partial<SmartOfficeCase>;
  syncDirection: 'toSmartOffice' | 'fromSmartOffice' | 'bidirectional';
}

export interface SyncCaseResponse {
  success: boolean;
  smartOfficeCaseId?: string;
  valorCaseId: string;
  syncedAt: string;
  errors?: string[];
}
```

#### 2. `lib/integrations/smart-office/client.ts`

```typescript
/**
 * Smart Office API Client
 */

import { BaseIntegration } from '../base-integration';
import { smartOfficeConfig } from '../config';
import {
  SmartOfficeCase,
  SmartOfficeClient,
  SmartOfficeActivity,
  SmartOfficeCommission,
  SyncCaseRequest,
  SyncCaseResponse,
} from './types';

export class SmartOfficeClient extends BaseIntegration {
  get name(): string {
    return 'Smart Office';
  }

  get baseUrl(): string {
    return this.config.baseUrl || 'https://api.smartoffice.com/v1';
  }

  constructor() {
    super(smartOfficeConfig);
  }

  /**
   * Override auth headers - Smart Office uses API Key + Secret
   */
  protected getAuthHeaders(): Record<string, string> {
    return {
      'X-API-Key': this.config.apiKey || '',
      'X-API-Secret': this.config.apiSecret || '',
    };
  }

  /**
   * Sync case from Valor to Smart Office
   */
  async syncCaseToSmartOffice(request: SyncCaseRequest): Promise<SyncCaseResponse> {
    if (!this.config.enabled) {
      return this.getMockSyncResponse(request);
    }

    const response = await this.request<SyncCaseResponse>(
      '/cases/sync',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );

    return response;
  }

  /**
   * Get case from Smart Office by ID
   */
  async getCase(caseId: string): Promise<SmartOfficeCase> {
    if (!this.config.enabled) {
      return this.getMockCase(caseId);
    }

    return this.request<SmartOfficeCase>(`/cases/${caseId}`);
  }

  /**
   * Get client from Smart Office
   */
  async getClient(clientId: string): Promise<SmartOfficeClient> {
    if (!this.config.enabled) {
      return this.getMockClient(clientId);
    }

    return this.request<SmartOfficeClient>(`/clients/${clientId}`);
  }

  /**
   * Create or update client in Smart Office
   */
  async syncClient(client: Partial<SmartOfficeClient>): Promise<SmartOfficeClient> {
    if (!this.config.enabled) {
      return this.getMockClient(client.clientId || 'MOCK-CLIENT');
    }

    return this.request<SmartOfficeClient>(
      '/clients',
      {
        method: 'POST',
        body: JSON.stringify(client),
      }
    );
  }

  /**
   * Log activity in Smart Office
   */
  async logActivity(activity: Partial<SmartOfficeActivity>): Promise<SmartOfficeActivity> {
    if (!this.config.enabled) {
      return this.getMockActivity();
    }

    return this.request<SmartOfficeActivity>(
      '/activities',
      {
        method: 'POST',
        body: JSON.stringify(activity),
      }
    );
  }

  /**
   * Get commissions for a case
   */
  async getCommissions(caseId: string): Promise<SmartOfficeCommission[]> {
    if (!this.config.enabled) {
      return [];
    }

    const response = await this.request<{ commissions: SmartOfficeCommission[] }>(
      `/cases/${caseId}/commissions`
    );

    return response.commissions;
  }

  // Mock data methods for development
  private getMockSyncResponse(request: SyncCaseRequest): SyncCaseResponse {
    return {
      success: true,
      smartOfficeCaseId: `SO-${Date.now()}`,
      valorCaseId: request.valorCaseId,
      syncedAt: new Date().toISOString(),
    };
  }

  private getMockCase(caseId: string): SmartOfficeCase {
    return {
      caseId,
      caseNumber: `CASE-${Math.floor(Math.random() * 10000)}`,
      clientId: 'CLIENT-123',
      clientName: 'John Doe',
      productType: 'Life',
      carrier: 'Example Life Insurance',
      product: 'Term 20',
      faceAmount: 500000,
      premium: 850,
      status: 'Submitted',
      applicationDate: new Date().toISOString(),
      agentId: 'AGENT-123',
      agentName: 'Agent Name',
    };
  }

  private getMockClient(clientId: string): SmartOfficeClient {
    return {
      clientId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-0123',
    };
  }

  private getMockActivity(): SmartOfficeActivity {
    return {
      activityId: `ACT-${Date.now()}`,
      type: 'Note',
      subject: 'Case synced from Valor',
      date: new Date().toISOString(),
      agentId: 'AGENT-123',
      completed: true,
    };
  }
}

// Export singleton instance
export const smartOfficeClient = new SmartOfficeClient();
```

#### 3. `app/api/cases/sync-smart-office/route.ts`

```typescript
/**
 * API route to sync case with Smart Office
 */

import { NextRequest, NextResponse } from 'next/server';
import { smartOfficeClient } from '@/lib/integrations/smart-office/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { valorCaseId, caseData } = body;

    if (!valorCaseId) {
      return NextResponse.json(
        { error: 'valorCaseId is required' },
        { status: 400 }
      );
    }

    const result = await smartOfficeClient.syncCaseToSmartOffice({
      valorCaseId,
      caseData,
      syncDirection: 'toSmartOffice',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Smart Office sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync with Smart Office' },
      { status: 500 }
    );
  }
}
```

### Integration Points

**Where to use in the app**:
1. **Cases Page** (`app/cases/page.tsx`) - Add "Sync to Smart Office" button
2. **Case Detail** - Auto-sync on case creation/update
3. **Dashboard** - Show Smart Office sync status
4. **Admin Settings** - Configure sync preferences

---

## 2. SuranceBay - Contract Requests

### Purpose
Request contracts and carrier appointments through SuranceBay's network.

### Business Value
- **Instant contracting** - Request carrier contracts online
- **Appointment tracking** - Track appointment status
- **E&O verification** - Verify E&O insurance
- **License verification** - Check agent licensing status
- **Document management** - Upload and manage required documents

### Provider Information
- **Company**: SuranceBay
- **Website**: https://www.surancebay.com
- **API Docs**: Available through SuranceBay partner portal
- **Access**: Direct partnership with SuranceBay

### Configuration (Already Added)

**Location**: `lib/integrations/config.ts` (lines 100-108)

```typescript
export const suranceBayConfig: IntegrationConfig = {
  enabled: process.env.SURANCEBAY_ENABLED === 'true',
  apiKey: process.env.SURANCEBAY_API_KEY,
  apiSecret: process.env.SURANCEBAY_API_SECRET,
  baseUrl: process.env.SURANCEBAY_BASE_URL || 'https://api.surancebay.com/v1',
  timeout: Number(process.env.SURANCEBAY_TIMEOUT) || 30000,
  retryAttempts: Number(process.env.SURANCEBAY_RETRY_ATTEMPTS) || 3,
  retryDelay: Number(process.env.SURANCEBAY_RETRY_DELAY) || 1000,
};
```

### Files to Create

#### 1. `lib/integrations/surancebay/types.ts`

```typescript
/**
 * SuranceBay API types
 */

export interface SuranceBayCarrier {
  carrierId: string;
  carrierName: string;
  productLines: string[];
  contractingAvailable: boolean;
  appointmentRequired: boolean;
  eAndORequired: boolean;
  minimumEAndOCoverage?: number;
  states: string[];
  turnaroundTime: string; // e.g., "5-7 business days"
}

export interface ContractRequest {
  agentId: string;
  carrierId: string;
  carrierName: string;
  productLines: string[];
  states: string[];
  agentInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    npn: string; // National Producer Number
    taxId: string; // SSN or EIN
    businessType: 'Individual' | 'Corporation' | 'LLC' | 'Partnership';
  };
  licenses: AgentLicense[];
  eAndO: EAndOPolicy;
  uplineInfo?: {
    agencyName?: string;
    agencyNpn?: string;
    uplineAgentNpn?: string;
  };
}

export interface AgentLicense {
  state: string;
  licenseNumber: string;
  type: 'Life' | 'Health' | 'Property & Casualty' | 'Variable';
  issueDate: string;
  expirationDate: string;
  residentState: boolean;
}

export interface EAndOPolicy {
  carrier: string;
  policyNumber: string;
  coverageAmount: number;
  effectiveDate: string;
  expirationDate: string;
  certificateUrl?: string;
}

export interface ContractRequestResponse {
  requestId: string;
  status: 'Submitted' | 'In Review' | 'Pending Documents' | 'Approved' | 'Declined';
  carrierId: string;
  carrierName: string;
  submittedDate: string;
  estimatedCompletionDate?: string;
  requiredDocuments?: RequiredDocument[];
  notes?: string;
}

export interface RequiredDocument {
  documentType: string;
  description: string;
  required: boolean;
  uploaded: boolean;
  uploadUrl?: string;
}

export interface AppointmentStatus {
  appointmentId: string;
  carrierId: string;
  carrierName: string;
  status: 'Pending' | 'Active' | 'Terminated' | 'Suspended';
  effectiveDate?: string;
  terminationDate?: string;
  states: string[];
  productLines: string[];
  commissionLevels?: Record<string, number>;
}
```

#### 2. `lib/integrations/surancebay/client.ts`

```typescript
/**
 * SuranceBay API Client
 */

import { BaseIntegration } from '../base-integration';
import { suranceBayConfig } from '../config';
import {
  SuranceBayCarrier,
  ContractRequest,
  ContractRequestResponse,
  AppointmentStatus,
} from './types';

export class SuranceBayClient extends BaseIntegration {
  get name(): string {
    return 'SuranceBay';
  }

  get baseUrl(): string {
    return this.config.baseUrl || 'https://api.surancebay.com/v1';
  }

  constructor() {
    super(suranceBayConfig);
  }

  /**
   * Get list of available carriers
   */
  async getAvailableCarriers(productLine?: string): Promise<SuranceBayCarrier[]> {
    if (!this.config.enabled) {
      return this.getMockCarriers();
    }

    const params = productLine ? `?productLine=${productLine}` : '';
    const response = await this.request<{ carriers: SuranceBayCarrier[] }>(
      `/carriers${params}`
    );

    return response.carriers;
  }

  /**
   * Submit contract request
   */
  async requestContract(request: ContractRequest): Promise<ContractRequestResponse> {
    if (!this.config.enabled) {
      return this.getMockContractResponse();
    }

    return this.request<ContractRequestResponse>(
      '/contracts/request',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * Get contract request status
   */
  async getContractStatus(requestId: string): Promise<ContractRequestResponse> {
    if (!this.config.enabled) {
      return this.getMockContractResponse();
    }

    return this.request<ContractRequestResponse>(
      `/contracts/request/${requestId}`
    );
  }

  /**
   * Get agent's appointments
   */
  async getAppointments(agentNpn: string): Promise<AppointmentStatus[]> {
    if (!this.config.enabled) {
      return this.getMockAppointments();
    }

    const response = await this.request<{ appointments: AppointmentStatus[] }>(
      `/agents/${agentNpn}/appointments`
    );

    return response.appointments;
  }

  /**
   * Upload required document
   */
  async uploadDocument(
    requestId: string,
    documentType: string,
    fileData: FormData
  ): Promise<{ success: boolean; documentUrl: string }> {
    if (!this.config.enabled) {
      return {
        success: true,
        documentUrl: 'https://example.com/mock-document.pdf',
      };
    }

    return this.request(
      `/contracts/request/${requestId}/documents/${documentType}`,
      {
        method: 'POST',
        body: fileData,
        headers: {
          // Don't set Content-Type, let browser set it with boundary
          ...this.getAuthHeaders(),
        },
      }
    );
  }

  // Mock data methods
  private getMockCarriers(): SuranceBayCarrier[] {
    return [
      {
        carrierId: 'CARRIER-1',
        carrierName: 'National Life Group',
        productLines: ['Life', 'Annuity'],
        contractingAvailable: true,
        appointmentRequired: true,
        eAndORequired: true,
        minimumEAndOCoverage: 1000000,
        states: ['ALL'],
        turnaroundTime: '5-7 business days',
      },
      {
        carrierId: 'CARRIER-2',
        carrierName: 'Pacific Life',
        productLines: ['Annuity', 'Life'],
        contractingAvailable: true,
        appointmentRequired: true,
        eAndORequired: true,
        minimumEAndOCoverage: 1000000,
        states: ['ALL'],
        turnaroundTime: '7-10 business days',
      },
    ];
  }

  private getMockContractResponse(): ContractRequestResponse {
    return {
      requestId: `REQ-${Date.now()}`,
      status: 'Submitted',
      carrierId: 'CARRIER-1',
      carrierName: 'National Life Group',
      submittedDate: new Date().toISOString(),
      estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      requiredDocuments: [
        {
          documentType: 'W9',
          description: 'IRS Form W-9',
          required: true,
          uploaded: false,
        },
        {
          documentType: 'E_AND_O',
          description: 'E&O Insurance Certificate',
          required: true,
          uploaded: false,
        },
      ],
    };
  }

  private getMockAppointments(): AppointmentStatus[] {
    return [
      {
        appointmentId: 'APT-1',
        carrierId: 'CARRIER-1',
        carrierName: 'National Life Group',
        status: 'Active',
        effectiveDate: '2024-01-01',
        states: ['CA', 'TX', 'FL'],
        productLines: ['Life', 'Annuity'],
        commissionLevels: {
          'Term Life': 100,
          'Whole Life': 95,
          'Annuity': 6,
        },
      },
    ];
  }
}

// Export singleton instance
export const suranceBayClient = new SuranceBayClient();
```

#### 3. `app/api/contracts/request/route.ts`

```typescript
/**
 * API route for contract requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { suranceBayClient } from '@/lib/integrations/surancebay/client';

export async function POST(request: NextRequest) {
  try {
    const contractRequest = await request.json();

    const result = await suranceBayClient.requestContract(contractRequest);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Contract request error:', error);
    return NextResponse.json(
      { error: 'Failed to submit contract request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json(
        { error: 'requestId is required' },
        { status: 400 }
      );
    }

    const status = await suranceBayClient.getContractStatus(requestId);

    return NextResponse.json(status);
  } catch (error) {
    console.error('Contract status error:', error);
    return NextResponse.json(
      { error: 'Failed to get contract status' },
      { status: 500 }
    );
  }
}
```

### Integration Points

**Where to use in the app**:
1. **Contracts Page** (`app/contracts/page.tsx`) - Add "Request New Contract" button
2. **Admin Dashboard** - Show contract request status
3. **Profile Page** - Display active appointments

---

## 3. iPipeline X-Ray - Underwriting Pre-Screen

### Purpose
Pre-screen applicants for underwriting before submitting full applications.

### Business Value
- **Faster decisions** - Get preliminary underwriting decisions in seconds
- **Reduce declines** - Know issues before submission
- **Better quotes** - Accurate rate class predictions
- **Time savings** - Avoid submitting applications that will be declined
- **Client experience** - Set proper expectations upfront

### Provider Information
- **Company**: iPipeline
- **Website**: https://ipipeline.com/products/x-ray
- **API Docs**: iPipeline Customer Portal
- **Access**: Same as main iPipeline integration

### Configuration (Already Added)

**Location**: `lib/integrations/config.ts` (lines 113-121)

```typescript
export const xRayConfig: IntegrationConfig = {
  enabled: process.env.XRAY_ENABLED === 'true',
  apiKey: process.env.XRAY_API_KEY,
  apiSecret: process.env.XRAY_API_SECRET,
  baseUrl: process.env.XRAY_BASE_URL || 'https://api.ipipeline.com/xray/v1',
  timeout: Number(process.env.XRAY_TIMEOUT) || 30000,
  retryAttempts: Number(process.env.XRAY_RETRY_ATTEMPTS) || 3,
  retryDelay: Number(process.env.XRAY_RETRY_DELAY) || 1000,
};
```

### Files to Create

#### 1. `lib/integrations/xray/types.ts`

```typescript
/**
 * iPipeline X-Ray API types
 */

export interface XRayPreScreenRequest {
  applicant: {
    age: number;
    gender: 'Male' | 'Female';
    tobacco: 'Never' | 'Former' | 'Current';
    height: {
      feet: number;
      inches: number;
    };
    weight: number;
    healthHistory: HealthCondition[];
    familyHistory?: FamilyHistory[];
    medications?: Medication[];
    lifestyle?: LifestyleFactors;
  };
  coverage: {
    type: 'Term' | 'Whole Life' | 'Universal Life';
    faceAmount: number;
    term?: number;
  };
  carriers?: string[]; // Optional: specific carriers to check
}

export interface HealthCondition {
  condition: string;
  diagnosisDate?: string;
  controlled: boolean;
  medication?: boolean;
  severity?: 'Mild' | 'Moderate' | 'Severe';
  notes?: string;
}

export interface FamilyHistory {
  relationship: 'Parent' | 'Sibling' | 'Grandparent';
  condition: string;
  ageAtDiagnosis?: number;
  deceased: boolean;
  ageAtDeath?: number;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  reason: string;
  startDate: string;
}

export interface LifestyleFactors {
  occupation: string;
  hazardousActivities: string[];
  dui: boolean;
  drivingViolations: number;
  foreignTravel: boolean;
}

export interface XRayPreScreenResponse {
  screenId: string;
  timestamp: string;
  applicantRisk: 'Low' | 'Medium' | 'High' | 'Uninsurable';
  predictedRateClass: string;
  confidence: number; // 0-100
  recommendations: XRayRecommendation[];
  carrierSpecific?: CarrierDecision[];
  flags: UnderwritingFlag[];
  estimatedDecision: 'Approved Standard' | 'Approved Rated' | 'Postpone' | 'Decline';
}

export interface XRayRecommendation {
  type: 'Product' | 'Coverage' | 'Action';
  title: string;
  description: string;
  impact: 'Positive' | 'Negative' | 'Neutral';
}

export interface CarrierDecision {
  carrierId: string;
  carrierName: string;
  decision: 'Approve' | 'Approve with Rating' | 'Postpone' | 'Decline';
  predictedRateClass?: string;
  rating?: number; // Table rating (e.g., 2 = Table 2)
  notes: string;
}

export interface UnderwritingFlag {
  category: 'Medical' | 'Financial' | 'Lifestyle' | 'Family History';
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  impact: string;
}
```

#### 2. `lib/integrations/xray/client.ts`

```typescript
/**
 * iPipeline X-Ray API Client
 */

import { BaseIntegration } from '../base-integration';
import { xRayConfig } from '../config';
import {
  XRayPreScreenRequest,
  XRayPreScreenResponse,
} from './types';

export class XRayClient extends BaseIntegration {
  get name(): string {
    return 'iPipeline X-Ray';
  }

  get baseUrl(): string {
    return this.config.baseUrl || 'https://api.ipipeline.com/xray/v1';
  }

  constructor() {
    super(xRayConfig);
  }

  /**
   * Run underwriting pre-screen
   */
  async preScreen(request: XRayPreScreenRequest): Promise<XRayPreScreenResponse> {
    if (!this.config.enabled) {
      return this.getMockPreScreenResponse(request);
    }

    return this.request<XRayPreScreenResponse>(
      '/prescreen',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * Get detailed explanation for a pre-screen result
   */
  async getScreenDetails(screenId: string): Promise<XRayPreScreenResponse> {
    if (!this.config.enabled) {
      throw new Error('X-Ray is not enabled');
    }

    return this.request<XRayPreScreenResponse>(`/prescreen/${screenId}`);
  }

  // Mock data for development
  private getMockPreScreenResponse(request: XRayPreScreenRequest): XRayPreScreenResponse {
    const { applicant, coverage } = request;

    // Simple risk calculation
    let risk: 'Low' | 'Medium' | 'High' | 'Uninsurable' = 'Low';
    const flags: any[] = [];

    // Check age
    if (applicant.age > 65) {
      risk = 'Medium';
      flags.push({
        category: 'Medical',
        severity: 'Medium',
        description: 'Age over 65',
        impact: 'May require medical exam',
      });
    }

    // Check tobacco
    if (applicant.tobacco === 'Current') {
      risk = 'Medium';
      flags.push({
        category: 'Lifestyle',
        severity: 'High',
        description: 'Current tobacco user',
        impact: 'Will receive tobacco rates (typically 2x non-tobacco)',
      });
    }

    // Check health conditions
    if (applicant.healthHistory.length > 0) {
      risk = 'Medium';
      applicant.healthHistory.forEach((condition) => {
        flags.push({
          category: 'Medical',
          severity: condition.severity || 'Medium',
          description: condition.condition,
          impact: 'May require medical records or exam',
        });
      });
    }

    // Calculate BMI
    const heightInches = (applicant.height.feet * 12) + applicant.height.inches;
    const bmi = (applicant.weight / (heightInches * heightInches)) * 703;

    if (bmi > 30 || bmi < 18.5) {
      risk = 'Medium';
      flags.push({
        category: 'Medical',
        severity: 'Medium',
        description: `BMI ${bmi.toFixed(1)} outside preferred range`,
        impact: 'May affect rate class',
      });
    }

    return {
      screenId: `XRAY-${Date.now()}`,
      timestamp: new Date().toISOString(),
      applicantRisk: risk,
      predictedRateClass: risk === 'Low' ? 'Preferred Plus' : risk === 'Medium' ? 'Standard' : 'Substandard',
      confidence: 85,
      recommendations: [
        {
          type: 'Product',
          title: 'Consider Guaranteed Issue',
          description: 'For applicants with health concerns, guaranteed issue products may be faster',
          impact: 'Neutral',
        },
        {
          type: 'Action',
          title: 'Gather Medical Records',
          description: 'Obtaining medical records before submission may speed up underwriting',
          impact: 'Positive',
        },
      ],
      carrierSpecific: [
        {
          carrierId: 'CARRIER-1',
          carrierName: 'Example Life',
          decision: risk === 'Low' ? 'Approve' : 'Approve with Rating',
          predictedRateClass: risk === 'Low' ? 'Preferred' : 'Standard',
          notes: 'Good fit for this applicant profile',
        },
      ],
      flags,
      estimatedDecision: risk === 'Low' ? 'Approved Standard' : 'Approved Rated',
    };
  }
}

// Export singleton instance
export const xRayClient = new XRayClient();
```

#### 3. `app/api/underwriting/prescreen/route.ts`

```typescript
/**
 * API route for underwriting pre-screen
 */

import { NextRequest, NextResponse } from 'next/server';
import { xRayClient } from '@/lib/integrations/xray/client';

export async function POST(request: NextRequest) {
  try {
    const prescreenRequest = await request.json();

    const result = await xRayClient.preScreen(prescreenRequest);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Pre-screen error:', error);
    return NextResponse.json(
      { error: 'Failed to run pre-screen' },
      { status: 500 }
    );
  }
}
```

### Integration Points

**Where to use in the app**:
1. **Quote Page** - Add "Pre-Screen" button before creating quote
2. **Application Page** - Auto-run pre-screen before submission
3. **Dashboard** - Show pre-screen results for pending quotes

---

## 4. Libra - Underwriting Guidelines

### Purpose
Access carrier-specific underwriting guidelines and requirements.

### Business Value
- **Know before you quote** - Check if client qualifies before running quotes
- **Faster decisions** - Understand carrier-specific requirements
- **Better placement** - Match clients to most suitable carriers
- **Reduce declines** - Avoid carriers with strict guidelines for specific conditions

### Provider Information
- **Company**: Alavere (formerly Libra)
- **Website**: https://www.alavere.com
- **API Docs**: Available through partner portal
- **Access**: Direct partnership

### Configuration (Already Added)

**Location**: `lib/integrations/config.ts` (lines 126-133)

```typescript
export const libraConfig: IntegrationConfig = {
  enabled: process.env.LIBRA_ENABLED === 'true',
  apiKey: process.env.LIBRA_API_KEY,
  baseUrl: process.env.LIBRA_BASE_URL || 'https://api.libra.com/v1',
  timeout: Number(process.env.LIBRA_TIMEOUT) || 30000,
  retryAttempts: Number(process.env.LIBRA_RETRY_ATTEMPTS) || 3,
  retryDelay: Number(process.env.LIBRA_RETRY_DELAY) || 1000,
};
```

### Files to Create

#### 1. `lib/integrations/libra/types.ts`

```typescript
/**
 * Libra Underwriting Guidelines API types
 */

export interface GuidelineSearchRequest {
  condition?: string;
  carrierId?: string;
  productType?: 'Term' | 'Whole Life' | 'Universal Life' | 'Annuity';
  faceAmount?: number;
  state?: string;
}

export interface UnderwritingGuideline {
  guidelineId: string;
  carrierId: string;
  carrierName: string;
  productType: string;
  condition: string;
  decision: 'Acceptable' | 'Rated' | 'Postpone' | 'Decline';
  ratingRange?: {
    min: number;
    max: number;
  };
  requirements: string[];
  notes: string;
  effectiveDate: string;
  lastUpdated: string;
}

export interface CarrierGuideline {
  carrierId: string;
  carrierName: string;
  categories: GuidelineCategory[];
  generalRequirements: GeneralRequirement[];
  specialPrograms?: SpecialProgram[];
}

export interface GuidelineCategory {
  categoryName: string;
  conditions: ConditionGuideline[];
}

export interface ConditionGuideline {
  condition: string;
  acceptanceCriteria: AcceptanceCriteria;
  exclusions?: string[];
  requiredDocuments?: string[];
}

export interface AcceptanceCriteria {
  standard: string[];
  rated: string[];
  decline: string[];
}

export interface GeneralRequirement {
  requirement: string;
  applicableAges?: {
    min: number;
    max: number;
  };
  applicableFaceAmounts?: {
    min: number;
    max: number;
  };
}

export interface SpecialProgram {
  programName: string;
  description: string;
  eligibilityCriteria: string[];
  benefits: string[];
}

export interface CompareCarriersRequest {
  condition: string;
  carriers: string[];
  productType?: string;
}

export interface CompareCarriersResponse {
  condition: string;
  comparisons: CarrierComparison[];
}

export interface CarrierComparison {
  carrierId: string;
  carrierName: string;
  decision: 'Acceptable' | 'Rated' | 'Postpone' | 'Decline';
  rating?: string;
  advantages: string[];
  disadvantages: string[];
  competitiveness: 'Best' | 'Good' | 'Fair' | 'Poor';
}
```

#### 2. `lib/integrations/libra/client.ts`

```typescript
/**
 * Libra Underwriting Guidelines API Client
 */

import { BaseIntegration } from '../base-integration';
import { libraConfig } from '../config';
import {
  GuidelineSearchRequest,
  UnderwritingGuideline,
  CarrierGuideline,
  CompareCarriersRequest,
  CompareCarriersResponse,
} from './types';

export class LibraClient extends BaseIntegration {
  get name(): string {
    return 'Libra';
  }

  get baseUrl(): string {
    return this.config.baseUrl || 'https://api.libra.com/v1';
  }

  constructor() {
    super(libraConfig);
  }

  /**
   * Search underwriting guidelines
   */
  async searchGuidelines(request: GuidelineSearchRequest): Promise<UnderwritingGuideline[]> {
    if (!this.config.enabled) {
      return this.getMockGuidelines(request);
    }

    const params = new URLSearchParams();
    if (request.condition) params.append('condition', request.condition);
    if (request.carrierId) params.append('carrierId', request.carrierId);
    if (request.productType) params.append('productType', request.productType);
    if (request.faceAmount) params.append('faceAmount', request.faceAmount.toString());
    if (request.state) params.append('state', request.state);

    const response = await this.request<{ guidelines: UnderwritingGuideline[] }>(
      `/guidelines/search?${params.toString()}`
    );

    return response.guidelines;
  }

  /**
   * Get complete guidelines for a carrier
   */
  async getCarrierGuidelines(carrierId: string): Promise<CarrierGuideline> {
    if (!this.config.enabled) {
      return this.getMockCarrierGuidelines(carrierId);
    }

    return this.request<CarrierGuideline>(`/carriers/${carrierId}/guidelines`);
  }

  /**
   * Compare multiple carriers for a specific condition
   */
  async compareCarriers(request: CompareCarriersRequest): Promise<CompareCarriersResponse> {
    if (!this.config.enabled) {
      return this.getMockComparison(request);
    }

    return this.request<CompareCarriersResponse>(
      '/guidelines/compare',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  // Mock data methods
  private getMockGuidelines(request: GuidelineSearchRequest): UnderwritingGuideline[] {
    return [
      {
        guidelineId: 'GL-1',
        carrierId: 'CARRIER-1',
        carrierName: 'Example Life',
        productType: request.productType || 'Term',
        condition: request.condition || 'Diabetes Type 2',
        decision: 'Rated',
        ratingRange: {
          min: 25,
          max: 150,
        },
        requirements: [
          'HbA1c level under 7.5%',
          'No diabetic complications',
          'On stable medication for 6+ months',
        ],
        notes: 'Preferred rates available for well-controlled cases',
        effectiveDate: '2024-01-01',
        lastUpdated: new Date().toISOString(),
      },
      {
        guidelineId: 'GL-2',
        carrierId: 'CARRIER-2',
        carrierName: 'National Insurance',
        productType: request.productType || 'Term',
        condition: request.condition || 'Diabetes Type 2',
        decision: 'Acceptable',
        requirements: [
          'HbA1c level under 8.0%',
          'Regular monitoring',
          'No hospitalizations in past year',
        ],
        notes: 'May consider standard rates for optimal control',
        effectiveDate: '2024-01-01',
        lastUpdated: new Date().toISOString(),
      },
    ];
  }

  private getMockCarrierGuidelines(carrierId: string): CarrierGuideline {
    return {
      carrierId,
      carrierName: 'Example Life',
      categories: [
        {
          categoryName: 'Cardiovascular',
          conditions: [
            {
              condition: 'Hypertension',
              acceptanceCriteria: {
                standard: ['Blood pressure under 140/90', 'On stable medication'],
                rated: ['Blood pressure 140-160/90-100', 'Multiple medications'],
                decline: ['Uncontrolled hypertension', 'Recent stroke'],
              },
              requiredDocuments: ['Attending Physician Statement'],
            },
          ],
        },
      ],
      generalRequirements: [
        {
          requirement: 'Medical exam required for face amounts over $500,000',
          applicableFaceAmounts: {
            min: 500000,
            max: 999999999,
          },
        },
      ],
      specialPrograms: [
        {
          programName: 'Preferred Health',
          description: 'Best rates for exceptionally healthy applicants',
          eligibilityCriteria: ['No tobacco use', 'Optimal BMI', 'No medications'],
          benefits: ['Up to 30% savings', 'Streamlined underwriting'],
        },
      ],
    };
  }

  private getMockComparison(request: CompareCarriersRequest): CompareCarriersResponse {
    return {
      condition: request.condition,
      comparisons: request.carriers.map((carrierId, index) => ({
        carrierId,
        carrierName: `Carrier ${index + 1}`,
        decision: index === 0 ? 'Acceptable' : 'Rated',
        rating: index === 0 ? undefined : 'Table 2',
        advantages: [
          'Quick underwriting',
          'Good rates for this condition',
        ],
        disadvantages: index === 0 ? [] : ['Requires medical records'],
        competitiveness: index === 0 ? 'Best' : 'Good',
      })),
    };
  }
}

// Export singleton instance
export const libraClient = new LibraClient();
```

#### 3. `app/api/guidelines/search/route.ts`

```typescript
/**
 * API route for guideline search
 */

import { NextRequest, NextResponse } from 'next/server';
import { libraClient } from '@/lib/integrations/libra/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const searchRequest = {
      condition: searchParams.get('condition') || undefined,
      carrierId: searchParams.get('carrierId') || undefined,
      productType: searchParams.get('productType') as any,
      faceAmount: searchParams.get('faceAmount') ? Number(searchParams.get('faceAmount')) : undefined,
      state: searchParams.get('state') || undefined,
    };

    const guidelines = await libraClient.searchGuidelines(searchRequest);

    return NextResponse.json({ guidelines });
  } catch (error) {
    console.error('Guideline search error:', error);
    return NextResponse.json(
      { error: 'Failed to search guidelines' },
      { status: 500 }
    );
  }
}
```

### Integration Points

**Where to use in the app**:
1. **Quote Page** - Show carrier suitability based on health conditions
2. **Knowledge Base** - Create searchable guideline database
3. **Application Page** - Display carrier-specific requirements

---

## 5. GoHighLevel - Training and Community

### Purpose
Integrate with GoHighLevel for training content delivery and community engagement.

### Business Value
- **Centralized training** - All training content in one place
- **Progress tracking** - Monitor agent training completion
- **Community forums** - Agent discussion and collaboration
- **Automated workflows** - Trigger training based on events
- **Certifications** - Track and manage certifications

### Provider Information
- **Company**: GoHighLevel
- **Website**: https://www.gohighlevel.com
- **API Docs**: https://highlevel.stoplight.io
- **Access**: GoHighLevel agency account required

### Configuration (Already Added)

**Location**: `lib/integrations/config.ts` (lines 138-145)

```typescript
export const goHighLevelConfig: IntegrationConfig = {
  enabled: process.env.GOHIGHLEVEL_ENABLED === 'true',
  apiKey: process.env.GOHIGHLEVEL_API_KEY,
  baseUrl: process.env.GOHIGHLEVEL_BASE_URL || 'https://rest.gohighlevel.com/v1',
  timeout: Number(process.env.GOHIGHLEVEL_TIMEOUT) || 30000,
  retryAttempts: Number(process.env.GOHIGHLEVEL_RETRY_ATTEMPTS) || 3,
  retryDelay: Number(process.env.GOHIGHLEVEL_RETRY_DELAY) || 1000,
};
```

### Files to Create

#### 1. `lib/integrations/gohighlevel/types.ts`

```typescript
/**
 * GoHighLevel API types
 */

export interface GHLContact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface GHLCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number; // minutes
  lessons: GHLLesson[];
  enrollmentCount: number;
  completionRate: number;
  certificateAvailable: boolean;
}

export interface GHLLesson {
  id: string;
  title: string;
  type: 'Video' | 'Document' | 'Quiz' | 'Assignment';
  contentUrl?: string;
  duration?: number;
  order: number;
}

export interface GHLEnrollment {
  enrollmentId: string;
  contactId: string;
  courseId: string;
  enrolledDate: string;
  status: 'In Progress' | 'Completed' | 'Not Started';
  progress: number; // 0-100
  completedLessons: string[];
  lastAccessedDate?: string;
  completionDate?: string;
  certificateUrl?: string;
}

export interface GHLWorkflow {
  id: string;
  name: string;
  trigger: string;
  actions: GHLWorkflowAction[];
}

export interface GHLWorkflowAction {
  type: 'Email' | 'SMS' | 'Tag' | 'Webhook' | 'Wait';
  config: Record<string, any>;
}

export interface EnrollUserRequest {
  contactId: string;
  courseId: string;
}

export interface RecordProgressRequest {
  enrollmentId: string;
  lessonId: string;
  completed: boolean;
  timeSpent?: number;
}
```

#### 2. `lib/integrations/gohighlevel/client.ts`

```typescript
/**
 * GoHighLevel API Client
 */

import { BaseIntegration } from '../base-integration';
import { goHighLevelConfig } from '../config';
import {
  GHLContact,
  GHLCourse,
  GHLEnrollment,
  EnrollUserRequest,
  RecordProgressRequest,
} from './types';

export class GoHighLevelClient extends BaseIntegration {
  get name(): string {
    return 'GoHighLevel';
  }

  get baseUrl(): string {
    return this.config.baseUrl || 'https://rest.gohighlevel.com/v1';
  }

  constructor() {
    super(goHighLevelConfig);
  }

  /**
   * Get or create contact
   */
  async syncContact(contact: Partial<GHLContact>): Promise<GHLContact> {
    if (!this.config.enabled) {
      return this.getMockContact(contact);
    }

    return this.request<GHLContact>(
      '/contacts',
      {
        method: 'POST',
        body: JSON.stringify(contact),
      }
    );
  }

  /**
   * Get available courses
   */
  async getCourses(category?: string): Promise<GHLCourse[]> {
    if (!this.config.enabled) {
      return this.getMockCourses();
    }

    const params = category ? `?category=${category}` : '';
    const response = await this.request<{ courses: GHLCourse[] }>(
      `/courses${params}`
    );

    return response.courses;
  }

  /**
   * Enroll user in course
   */
  async enrollUser(request: EnrollUserRequest): Promise<GHLEnrollment> {
    if (!this.config.enabled) {
      return this.getMockEnrollment(request);
    }

    return this.request<GHLEnrollment>(
      '/enrollments',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * Get user enrollments
   */
  async getUserEnrollments(contactId: string): Promise<GHLEnrollment[]> {
    if (!this.config.enabled) {
      return [];
    }

    const response = await this.request<{ enrollments: GHLEnrollment[] }>(
      `/contacts/${contactId}/enrollments`
    );

    return response.enrollments;
  }

  /**
   * Record lesson progress
   */
  async recordProgress(request: RecordProgressRequest): Promise<{ success: boolean }> {
    if (!this.config.enabled) {
      return { success: true };
    }

    return this.request(
      '/progress',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * Add tag to contact
   */
  async addTag(contactId: string, tag: string): Promise<{ success: boolean }> {
    if (!this.config.enabled) {
      return { success: true };
    }

    return this.request(
      `/contacts/${contactId}/tags`,
      {
        method: 'POST',
        body: JSON.stringify({ tag }),
      }
    );
  }

  // Mock data methods
  private getMockContact(contact: Partial<GHLContact>): GHLContact {
    return {
      id: `GHL-${Date.now()}`,
      email: contact.email || '',
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      phone: contact.phone,
      tags: contact.tags || [],
    };
  }

  private getMockCourses(): GHLCourse[] {
    return [
      {
        id: 'COURSE-1',
        title: 'Life Insurance Fundamentals',
        description: 'Learn the basics of life insurance sales',
        category: 'Life Insurance',
        duration: 120,
        lessons: [],
        enrollmentCount: 145,
        completionRate: 78,
        certificateAvailable: true,
      },
      {
        id: 'COURSE-2',
        title: 'Annuity Sales Mastery',
        description: 'Advanced strategies for selling annuities',
        category: 'Annuities',
        duration: 180,
        lessons: [],
        enrollmentCount: 98,
        completionRate: 65,
        certificateAvailable: true,
      },
    ];
  }

  private getMockEnrollment(request: EnrollUserRequest): GHLEnrollment {
    return {
      enrollmentId: `ENR-${Date.now()}`,
      contactId: request.contactId,
      courseId: request.courseId,
      enrolledDate: new Date().toISOString(),
      status: 'Not Started',
      progress: 0,
      completedLessons: [],
    };
  }
}

// Export singleton instance
export const goHighLevelClient = new GoHighLevelClient();
```

#### 3. `app/api/training/courses/route.ts`

```typescript
/**
 * API route for training courses
 */

import { NextRequest, NextResponse } from 'next/server';
import { goHighLevelClient } from '@/lib/integrations/gohighlevel/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;

    const courses = await goHighLevelClient.getCourses(category);

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Courses fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
```

### Integration Points

**Where to use in the app**:
1. **Training Page** (`app/training/page.tsx`) - Pull courses from GoHighLevel
2. **Profile Page** - Show training progress
3. **Dashboard** - Display recommended courses

---

## 6. Twilio - SMS Notifications

### Purpose
Send SMS notifications for important events and updates.

### Business Value
- **Instant notifications** - Text clients about application status
- **Higher engagement** - SMS has 98% open rate
- **Automated reminders** - Send appointment and task reminders
- **Two-way messaging** - Enable client communication via SMS
- **Verification codes** - 2FA and identity verification

### Provider Information
- **Company**: Twilio
- **Website**: https://www.twilio.com
- **API Docs**: https://www.twilio.com/docs
- **Access**: Create account at twilio.com/console

### Configuration (Already Added)

**Location**: `lib/integrations/config.ts` (lines 150-158)

```typescript
export const twilioConfig: IntegrationConfig = {
  enabled: process.env.TWILIO_ENABLED === 'true',
  apiKey: process.env.TWILIO_ACCOUNT_SID,
  apiSecret: process.env.TWILIO_AUTH_TOKEN,
  baseUrl: process.env.TWILIO_BASE_URL || 'https://api.twilio.com/2010-04-01',
  timeout: Number(process.env.TWILIO_TIMEOUT) || 10000,
  retryAttempts: Number(process.env.TWILIO_RETRY_ATTEMPTS) || 2,
  retryDelay: Number(process.env.TWILIO_RETRY_DELAY) || 500,
};
```

### Files to Create

#### 1. `lib/integrations/twilio/types.ts`

```typescript
/**
 * Twilio API types
 */

export interface SendSMSRequest {
  to: string; // Phone number in E.164 format (+1234567890)
  body: string;
  from?: string; // Optional: specific Twilio number to send from
  mediaUrl?: string[]; // Optional: MMS attachments
}

export interface SendSMSResponse {
  sid: string; // Message SID
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'undelivered' | 'failed';
  to: string;
  from: string;
  body: string;
  dateCreated: string;
  dateSent?: string;
  dateUpdated?: string;
  errorCode?: string;
  errorMessage?: string;
  price?: string;
  priceUnit?: string;
}

export interface SMSTemplate {
  name: string;
  body: string;
  variables?: string[];
}

export interface SendTemplatedSMSRequest {
  to: string;
  templateName: string;
  variables?: Record<string, string>;
}

// Pre-defined SMS templates
export const SMS_TEMPLATES: Record<string, SMSTemplate> = {
  APPLICATION_SUBMITTED: {
    name: 'Application Submitted',
    body: 'Hi {{firstName}}, your {{productType}} application has been submitted to {{carrier}}. We\'ll keep you updated on the status. - Valor Insurance',
    variables: ['firstName', 'productType', 'carrier'],
  },
  APPLICATION_APPROVED: {
    name: 'Application Approved',
    body: 'Great news {{firstName}}! Your {{productType}} application with {{carrier}} has been approved. Your agent will contact you shortly. - Valor Insurance',
    variables: ['firstName', 'productType', 'carrier'],
  },
  QUOTE_READY: {
    name: 'Quote Ready',
    body: 'Hi {{firstName}}, your insurance quotes are ready! We found great rates starting at ${{monthlyPremium}}/month. View them here: {{quoteLink}} - Valor Insurance',
    variables: ['firstName', 'monthlyPremium', 'quoteLink'],
  },
  APPOINTMENT_REMINDER: {
    name: 'Appointment Reminder',
    body: 'Reminder: You have an appointment with {{agentName}} on {{date}} at {{time}}. Reply CONFIRM or RESCHEDULE. - Valor Insurance',
    variables: ['agentName', 'date', 'time'],
  },
  DOCUMENT_REQUIRED: {
    name: 'Document Required',
    body: 'Hi {{firstName}}, {{carrier}} needs {{documentType}} for your application. Please upload at: {{uploadLink}} - Valor Insurance',
    variables: ['firstName', 'carrier', 'documentType', 'uploadLink'],
  },
  POLICY_ISSUED: {
    name: 'Policy Issued',
    body: 'Congratulations {{firstName}}! Your policy #{{policyNumber}} has been issued by {{carrier}}. Your coverage is now active. - Valor Insurance',
    variables: ['firstName', 'policyNumber', 'carrier'],
  },
  VERIFICATION_CODE: {
    name: 'Verification Code',
    body: 'Your Valor Insurance verification code is: {{code}}. This code expires in 10 minutes. Do not share this code with anyone.',
    variables: ['code'],
  },
};
```

#### 2. `lib/integrations/twilio/client.ts`

```typescript
/**
 * Twilio SMS API Client
 */

import { BaseIntegration } from '../base-integration';
import { twilioConfig } from '../config';
import {
  SendSMSRequest,
  SendSMSResponse,
  SendTemplatedSMSRequest,
  SMS_TEMPLATES,
} from './types';

export class TwilioClient extends BaseIntegration {
  private fromNumber: string;

  get name(): string {
    return 'Twilio';
  }

  get baseUrl(): string {
    return this.config.baseUrl || 'https://api.twilio.com/2010-04-01';
  }

  constructor() {
    super(twilioConfig);
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '+15555555555';
  }

  /**
   * Override auth headers - Twilio uses Basic Auth
   */
  protected getAuthHeaders(): Record<string, string> {
    const credentials = Buffer.from(
      `${this.config.apiKey}:${this.config.apiSecret}`
    ).toString('base64');

    return {
      'Authorization': `Basic ${credentials}`,
    };
  }

  /**
   * Send SMS message
   */
  async sendSMS(request: SendSMSRequest): Promise<SendSMSResponse> {
    if (!this.config.enabled) {
      return this.getMockSMSResponse(request);
    }

    // Twilio uses form-encoded data
    const body = new URLSearchParams({
      To: request.to,
      From: request.from || this.fromNumber,
      Body: request.body,
    });

    if (request.mediaUrl) {
      request.mediaUrl.forEach((url) => {
        body.append('MediaUrl', url);
      });
    }

    const response = await this.request<any>(
      `/Accounts/${this.config.apiKey}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...this.getAuthHeaders(),
        },
        body: body.toString(),
      }
    );

    return {
      sid: response.sid,
      status: response.status,
      to: response.to,
      from: response.from,
      body: response.body,
      dateCreated: response.date_created,
      dateSent: response.date_sent,
      errorCode: response.error_code,
      errorMessage: response.error_message,
      price: response.price,
      priceUnit: response.price_unit,
    };
  }

  /**
   * Send templated SMS
   */
  async sendTemplatedSMS(request: SendTemplatedSMSRequest): Promise<SendSMSResponse> {
    const template = SMS_TEMPLATES[request.templateName];

    if (!template) {
      throw new Error(`Template ${request.templateName} not found`);
    }

    // Replace template variables
    let body = template.body;
    if (request.variables) {
      Object.entries(request.variables).forEach(([key, value]) => {
        body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
    }

    return this.sendSMS({
      to: request.to,
      body,
    });
  }

  /**
   * Get message status
   */
  async getMessageStatus(messageSid: string): Promise<SendSMSResponse> {
    if (!this.config.enabled) {
      return this.getMockSMSResponse({ to: '', body: '' });
    }

    const response = await this.request<any>(
      `/Accounts/${this.config.apiKey}/Messages/${messageSid}.json`
    );

    return {
      sid: response.sid,
      status: response.status,
      to: response.to,
      from: response.from,
      body: response.body,
      dateCreated: response.date_created,
      dateSent: response.date_sent,
      errorCode: response.error_code,
      errorMessage: response.error_message,
    };
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phone: string): boolean {
    // E.164 format: +[country code][number]
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }

  /**
   * Format phone number to E.164
   */
  formatPhoneNumber(phone: string, countryCode: string = '1'): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // If already has country code, return with +
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }

    // If 10 digits, add country code
    if (digits.length === 10) {
      return `+${countryCode}${digits}`;
    }

    throw new Error('Invalid phone number format');
  }

  // Mock data method
  private getMockSMSResponse(request: SendSMSRequest): SendSMSResponse {
    return {
      sid: `SM${Date.now()}`,
      status: 'sent',
      to: request.to,
      from: request.from || this.fromNumber,
      body: request.body,
      dateCreated: new Date().toISOString(),
      dateSent: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const twilioClient = new TwilioClient();
```

#### 3. `app/api/notifications/sms/route.ts`

```typescript
/**
 * API route for sending SMS notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { twilioClient } from '@/lib/integrations/twilio/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, message, templateName, variables } = body;

    let result;

    if (templateName) {
      // Send templated SMS
      result = await twilioClient.sendTemplatedSMS({
        to,
        templateName,
        variables,
      });
    } else {
      // Send plain SMS
      if (!twilioClient.validatePhoneNumber(to)) {
        return NextResponse.json(
          { error: 'Invalid phone number format. Use E.164 format (+1234567890)' },
          { status: 400 }
        );
      }

      result = await twilioClient.sendSMS({
        to,
        body: message,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('SMS send error:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
}
```

### Integration Points

**Where to use in the app**:
1. **Application Status Changes** - Notify clients when status updates
2. **Quote Generation** - Send quote links via SMS
3. **Appointment Reminders** - Automated SMS reminders
4. **2FA/Verification** - Send verification codes
5. **Admin Settings** - Configure notification preferences

---

## 7. Calendly - Calendar Integration

### Purpose
Embed Calendly scheduling for client appointments and meetings.

### Business Value
- **Easy scheduling** - Clients book appointments without phone calls
- **Calendar sync** - Auto-sync with Google/Outlook calendars
- **Reduce no-shows** - Automated reminders
- **Time zone handling** - Automatic time zone conversion
- **Team scheduling** - Round-robin agent assignment

### Provider Information
- **Company**: Calendly
- **Website**: https://calendly.com
- **API Docs**: https://developer.calendly.com
- **Access**: Create account at calendly.com

### Configuration (Already Added)

**Location**: `lib/integrations/config.ts` (lines 163-170)

```typescript
export const calendlyConfig: IntegrationConfig = {
  enabled: process.env.CALENDLY_ENABLED === 'true',
  apiKey: process.env.CALENDLY_API_KEY,
  baseUrl: process.env.CALENDLY_BASE_URL || 'https://api.calendly.com',
  timeout: Number(process.env.CALENDLY_TIMEOUT) || 10000,
  retryAttempts: Number(process.env.CALENDLY_RETRY_ATTEMPTS) || 2,
  retryDelay: Number(process.env.CALENDLY_RETRY_DELAY) || 500,
};
```

### Files to Create

#### 1. `lib/integrations/calendly/types.ts`

```typescript
/**
 * Calendly API types
 */

export interface CalendlyEventType {
  uri: string;
  name: string;
  description: string;
  duration: number; // minutes
  slug: string;
  schedulingUrl: string;
  active: boolean;
  color: string;
  kind: 'solo' | 'group' | 'collective' | 'round_robin';
}

export interface CalendlyEvent {
  uri: string;
  name: string;
  status: 'active' | 'canceled';
  startTime: string;
  endTime: string;
  eventType: string;
  location?: {
    type: 'physical' | 'zoom' | 'phone' | 'custom';
    location?: string;
    joinUrl?: string;
  };
  invitees: CalendlyInvitee[];
  createdAt: string;
  updatedAt: string;
}

export interface CalendlyInvitee {
  uri: string;
  email: string;
  name: string;
  status: 'active' | 'canceled';
  timezone: string;
  createdAt: string;
  updatedAt: string;
  tracking?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
  questions?: CalendlyQuestionAnswer[];
}

export interface CalendlyQuestionAnswer {
  question: string;
  answer: string;
}

export interface CreateSchedulingLinkRequest {
  eventType: string; // Event type URI
  prefill?: {
    name?: string;
    email?: string;
    customAnswers?: Record<string, string>;
  };
  utmParams?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
}

export interface WebhookSubscription {
  uri: string;
  callbackUrl: string;
  events: CalendlyWebhookEvent[];
  state: 'active' | 'disabled';
  createdAt: string;
  updatedAt: string;
}

export type CalendlyWebhookEvent =
  | 'invitee.created'
  | 'invitee.canceled'
  | 'event.canceled';
```

#### 2. `lib/integrations/calendly/client.ts`

```typescript
/**
 * Calendly API Client
 */

import { BaseIntegration } from '../base-integration';
import { calendlyConfig } from '../config';
import {
  CalendlyEventType,
  CalendlyEvent,
  CreateSchedulingLinkRequest,
  WebhookSubscription,
} from './types';

export class CalendlyClient extends BaseIntegration {
  private organizationUri: string;

  get name(): string {
    return 'Calendly';
  }

  get baseUrl(): string {
    return this.config.baseUrl || 'https://api.calendly.com';
  }

  constructor() {
    super(calendlyConfig);
    this.organizationUri = process.env.CALENDLY_ORGANIZATION_URI || '';
  }

  /**
   * Override auth headers - Calendly uses Bearer token
   */
  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
    };
  }

  /**
   * Get current user's event types
   */
  async getEventTypes(): Promise<CalendlyEventType[]> {
    if (!this.config.enabled) {
      return this.getMockEventTypes();
    }

    const response = await this.request<{ collection: CalendlyEventType[] }>(
      '/event_types',
      {
        method: 'GET',
      }
    );

    return response.collection;
  }

  /**
   * Get specific event type
   */
  async getEventType(eventTypeUri: string): Promise<CalendlyEventType> {
    if (!this.config.enabled) {
      return this.getMockEventTypes()[0];
    }

    return this.request<CalendlyEventType>(
      `/event_types/${encodeURIComponent(eventTypeUri)}`
    );
  }

  /**
   * Create scheduling link with pre-filled data
   */
  async createSchedulingLink(request: CreateSchedulingLinkRequest): Promise<string> {
    if (!this.config.enabled) {
      return 'https://calendly.com/mock-event';
    }

    // Calendly scheduling links are constructed, not created via API
    const baseUrl = request.eventType;
    const params = new URLSearchParams();

    if (request.prefill?.name) {
      params.append('name', request.prefill.name);
    }
    if (request.prefill?.email) {
      params.append('email', request.prefill.email);
    }
    if (request.utmParams?.utmSource) {
      params.append('utm_source', request.utmParams.utmSource);
    }
    if (request.utmParams?.utmMedium) {
      params.append('utm_medium', request.utmParams.utmMedium);
    }
    if (request.utmParams?.utmCampaign) {
      params.append('utm_campaign', request.utmParams.utmCampaign);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Get scheduled events
   */
  async getScheduledEvents(
    startTime?: string,
    endTime?: string
  ): Promise<CalendlyEvent[]> {
    if (!this.config.enabled) {
      return this.getMockEvents();
    }

    const params = new URLSearchParams({
      organization: this.organizationUri,
    });

    if (startTime) params.append('min_start_time', startTime);
    if (endTime) params.append('max_start_time', endTime);

    const response = await this.request<{ collection: CalendlyEvent[] }>(
      `/scheduled_events?${params.toString()}`
    );

    return response.collection;
  }

  /**
   * Cancel event
   */
  async cancelEvent(eventUri: string, reason?: string): Promise<{ success: boolean }> {
    if (!this.config.enabled) {
      return { success: true };
    }

    await this.request(
      `/scheduled_events/${encodeURIComponent(eventUri)}/cancellation`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );

    return { success: true };
  }

  /**
   * Create webhook subscription
   */
  async createWebhook(
    callbackUrl: string,
    events: string[]
  ): Promise<WebhookSubscription> {
    if (!this.config.enabled) {
      return this.getMockWebhook(callbackUrl, events);
    }

    return this.request<WebhookSubscription>(
      '/webhook_subscriptions',
      {
        method: 'POST',
        body: JSON.stringify({
          url: callbackUrl,
          events,
          organization: this.organizationUri,
          scope: 'organization',
        }),
      }
    );
  }

  // Mock data methods
  private getMockEventTypes(): CalendlyEventType[] {
    return [
      {
        uri: 'https://api.calendly.com/event_types/MOCK1',
        name: 'Insurance Consultation',
        description: '30 minute consultation to discuss your insurance needs',
        duration: 30,
        slug: 'insurance-consultation',
        schedulingUrl: 'https://calendly.com/yourname/insurance-consultation',
        active: true,
        color: '#0069ff',
        kind: 'solo',
      },
      {
        uri: 'https://api.calendly.com/event_types/MOCK2',
        name: 'Policy Review',
        description: '45 minute review of existing policies',
        duration: 45,
        slug: 'policy-review',
        schedulingUrl: 'https://calendly.com/yourname/policy-review',
        active: true,
        color: '#00a2ff',
        kind: 'solo',
      },
    ];
  }

  private getMockEvents(): CalendlyEvent[] {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return [
      {
        uri: 'https://api.calendly.com/scheduled_events/MOCK1',
        name: 'Insurance Consultation',
        status: 'active',
        startTime: futureDate.toISOString(),
        endTime: new Date(futureDate.getTime() + 30 * 60 * 1000).toISOString(),
        eventType: 'https://api.calendly.com/event_types/MOCK1',
        location: {
          type: 'zoom',
          joinUrl: 'https://zoom.us/j/mock123456',
        },
        invitees: [
          {
            uri: 'https://api.calendly.com/invitees/MOCK1',
            email: 'client@example.com',
            name: 'John Doe',
            status: 'active',
            timezone: 'America/New_York',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          },
        ],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];
  }

  private getMockWebhook(callbackUrl: string, events: string[]): WebhookSubscription {
    return {
      uri: 'https://api.calendly.com/webhook_subscriptions/MOCK1',
      callbackUrl,
      events: events as any,
      state: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const calendlyClient = new CalendlyClient();
```

#### 3. `app/api/scheduling/calendly/route.ts`

```typescript
/**
 * API route for Calendly scheduling
 */

import { NextRequest, NextResponse } from 'next/server';
import { calendlyClient } from '@/lib/integrations/calendly/client';

export async function GET(request: NextRequest) {
  try {
    const eventTypes = await calendlyClient.getEventTypes();

    return NextResponse.json({ eventTypes });
  } catch (error) {
    console.error('Calendly event types error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event types' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, prefill, utmParams } = body;

    const schedulingLink = await calendlyClient.createSchedulingLink({
      eventType,
      prefill,
      utmParams,
    });

    return NextResponse.json({ schedulingLink });
  } catch (error) {
    console.error('Calendly scheduling link error:', error);
    return NextResponse.json(
      { error: 'Failed to create scheduling link' },
      { status: 500 }
    );
  }
}
```

#### 4. `app/api/webhooks/calendly/route.ts`

```typescript
/**
 * Webhook handler for Calendly events
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, payload } = body;

    console.log('Calendly webhook received:', event, payload);

    // Handle different webhook events
    switch (event) {
      case 'invitee.created':
        // New appointment booked
        console.log('New appointment:', payload);
        // TODO: Send confirmation email/SMS
        // TODO: Update CRM
        break;

      case 'invitee.canceled':
        // Appointment canceled
        console.log('Appointment canceled:', payload);
        // TODO: Send cancellation notification
        // TODO: Update CRM
        break;

      case 'event.canceled':
        // Event canceled by host
        console.log('Event canceled by host:', payload);
        // TODO: Notify invitees
        break;

      default:
        console.log('Unknown event type:', event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Calendly webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

### Integration Points

**Where to use in the app**:
1. **Landing Page** - "Schedule Consultation" CTA
2. **Quote Results** - "Discuss with Agent" button
3. **Application Page** - Schedule follow-up appointments
4. **Profile Page** - View upcoming appointments

---

## Testing & Deployment

### Local Development Testing

1. **Set up environment variables**:
```bash
cp .env.example .env.local
# Add your test API credentials
```

2. **Test each integration individually**:
```typescript
// In your component or API route
import { smartOfficeClient } from '@/lib/integrations/smart-office/client';

const health = await smartOfficeClient.healthCheck();
console.log(health);
```

3. **Use mock mode for UI development**:
- Set `*_ENABLED=false` in `.env.local`
- All integrations will return realistic mock data
- No API calls will be made

### Integration Testing Checklist

For each integration:

- [ ] Configuration loads correctly
- [ ] Display name appears in admin UI
- [ ] Health check returns expected result
- [ ] Mock mode works without credentials
- [ ] API calls succeed with valid credentials
- [ ] Error handling works for invalid credentials
- [ ] Retry logic works for transient failures
- [ ] Audit logs are created
- [ ] TypeScript types are complete
- [ ] All methods have JSDoc comments

### Environment Variables Reference

Create a `.env.example` file with all required variables:

```env
# Smart Office (3Mark/Zinnia)
SMART_OFFICE_ENABLED=false
SMART_OFFICE_API_KEY=
SMART_OFFICE_API_SECRET=
SMART_OFFICE_BASE_URL=https://api.smartoffice.com/v1
SMART_OFFICE_TIMEOUT=30000
SMART_OFFICE_RETRY_ATTEMPTS=3
SMART_OFFICE_RETRY_DELAY=1000

# SuranceBay
SURANCEBAY_ENABLED=false
SURANCEBAY_API_KEY=
SURANCEBAY_API_SECRET=
SURANCEBAY_BASE_URL=https://api.surancebay.com/v1
SURANCEBAY_TIMEOUT=30000
SURANCEBAY_RETRY_ATTEMPTS=3
SURANCEBAY_RETRY_DELAY=1000

# iPipeline X-Ray
XRAY_ENABLED=false
XRAY_API_KEY=
XRAY_API_SECRET=
XRAY_BASE_URL=https://api.ipipeline.com/xray/v1
XRAY_TIMEOUT=30000
XRAY_RETRY_ATTEMPTS=3
XRAY_RETRY_DELAY=1000

# Libra
LIBRA_ENABLED=false
LIBRA_API_KEY=
LIBRA_BASE_URL=https://api.libra.com/v1
LIBRA_TIMEOUT=30000
LIBRA_RETRY_ATTEMPTS=3
LIBRA_RETRY_DELAY=1000

# GoHighLevel
GOHIGHLEVEL_ENABLED=false
GOHIGHLEVEL_API_KEY=
GOHIGHLEVEL_BASE_URL=https://rest.gohighlevel.com/v1
GOHIGHLEVEL_TIMEOUT=30000
GOHIGHLEVEL_RETRY_ATTEMPTS=3
GOHIGHLEVEL_RETRY_DELAY=1000

# Twilio
TWILIO_ENABLED=false
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_BASE_URL=https://api.twilio.com/2010-04-01
TWILIO_TIMEOUT=10000
TWILIO_RETRY_ATTEMPTS=2
TWILIO_RETRY_DELAY=500

# Calendly
CALENDLY_ENABLED=false
CALENDLY_API_KEY=
CALENDLY_ORGANIZATION_URI=
CALENDLY_BASE_URL=https://api.calendly.com
CALENDLY_TIMEOUT=10000
CALENDLY_RETRY_ATTEMPTS=2
CALENDLY_RETRY_DELAY=500
```

### Deployment Steps

1. **Review code**: Ensure all integrations follow the established patterns
2. **Test locally**: Verify mock mode works
3. **Test with credentials**: Test with real API credentials in dev environment
4. **Update documentation**: Document any provider-specific quirks
5. **Deploy to staging**: Test in staging environment
6. **Production credentials**: Add production API keys to production env
7. **Enable gradually**: Enable one integration at a time
8. **Monitor logs**: Watch for errors in integration logs
9. **User acceptance testing**: Have users test each integration
10. **Document for support**: Create support docs for common issues

### Common Issues & Solutions

**Issue**: "Integration not appearing in admin UI"
- **Solution**: Verify display name added to `app/api/admin/integrations/route.ts`

**Issue**: "Type errors in client implementation"
- **Solution**: Ensure all types are properly exported from `types.ts`

**Issue**: "Mock data not returning"
- **Solution**: Check `config.enabled` is false and mock methods are implemented

**Issue**: "Authentication failures"
- **Solution**: Verify auth header format matches provider requirements

**Issue**: "Timeout errors"
- **Solution**: Increase timeout in config or check network connectivity

---

## Summary

This guide provides complete specifications for implementing 7 new integrations. Each integration:

1. ✅ **Has configuration defined** in `lib/integrations/config.ts`
2. ✅ **Has display name** in admin API
3. ✅ **Follows BaseIntegration pattern** for consistency
4. ✅ **Includes TypeScript types** for type safety
5. ✅ **Has mock data support** for development
6. ✅ **Includes API routes** for frontend consumption
7. ✅ **Has health check** functionality
8. ✅ **Includes error handling** and retry logic
9. ✅ **Has audit logging** built-in
10. ✅ **Is documented** with JSDoc comments

### File Checklist

For each integration, create these files:

```
lib/integrations/[name]/
├── types.ts           # TypeScript interfaces
├── client.ts          # API client class
└── index.ts           # Public exports

app/api/[feature]/
└── route.ts           # API endpoint(s)

app/api/webhooks/[name]/
└── route.ts           # Webhook handler (if applicable)
```

### Next Steps

1. Choose an integration to start with (recommend starting with **Twilio** as it's simplest)
2. Create the directory structure
3. Copy the type definitions
4. Implement the client class
5. Create the API routes
6. Test in mock mode
7. Test with real credentials
8. Repeat for remaining integrations

Good luck with implementation! 🚀

---

**Document Version**: 1.0
**Last Updated**: November 2024
**Maintainer**: Valor Development Team
