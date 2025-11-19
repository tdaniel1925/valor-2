# Phase 4: Third-Party Integrations - Implementation Plan

**Start Date:** November 17, 2025
**Timeline:** Sprint 9-12 (Week 17-24) - 8 weeks
**Status:** 🚀 IN PROGRESS 5%

---

## 🎯 Executive Summary

Phase 4 will bring the Valor Insurance Platform to life by integrating with essential third-party systems. This phase transforms the foundations built in Phase 3 into a fully functional quoting and application submission system.

### Key Objectives:
1. **Enable live quoting** from carrier APIs (WinFlex, iPipeline, RateWatch)
2. **Electronic application submission** (iGo eApp, Firelight)
3. **Automated document generation** (PDF illustrations, email delivery)
4. **Real-time data synchronization** across all systems
5. **Robust error handling** and monitoring

---

## 📋 Integration Architecture

### **Integration Framework Pattern:**

```
User Interface (Next.js)
    ↓
API Routes (/api/integrations/*)
    ↓
Integration Service Layer (lib/integrations/)
    ├── API Clients (WinFlex, iPipeline, etc.)
    ├── Data Transformers (normalize data)
    ├── Error Handlers (retry logic)
    ├── Cache Layer (Redis/React Query)
    └── Event Emitters (sync status)
    ↓
Third-Party APIs
    ↓
Response → Transform → Cache → Update UI
```

### **Core Principles:**
- **Separation of Concerns** - Each integration in its own module
- **Fail-Safe Defaults** - Graceful degradation when APIs are unavailable
- **Retry Logic** - Exponential backoff for transient failures
- **Audit Trail** - Log all API calls for debugging
- **Type Safety** - TypeScript interfaces for all API responses
- **Testing** - Mock APIs for development and testing

---

## 🔌 Priority 1: Integration Framework (Sprint 9 - Week 17-18)

### **Goals:**
Build the centralized infrastructure that all integrations will use.

### **Deliverables:**

#### 1.1 Integration Service Base Class
**File:** `lib/integrations/base-integration.ts`

```typescript
export abstract class BaseIntegration {
  abstract name: string;
  abstract baseUrl: string;

  protected async request<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<T> {
    // Retry logic with exponential backoff
    // Error logging
    // Response transformation
    // Cache handling
  }

  protected handleError(error: Error): IntegrationError {
    // Standardized error handling
  }

  abstract healthCheck(): Promise<boolean>;
}
```

#### 1.2 Integration Configuration System
**File:** `lib/integrations/config.ts`

```typescript
export const integrationConfig = {
  winflex: {
    enabled: process.env.WINFLEX_ENABLED === 'true',
    apiKey: process.env.WINFLEX_API_KEY,
    baseUrl: process.env.WINFLEX_BASE_URL,
    timeout: 30000,
    retryAttempts: 3,
  },
  // ... other integrations
};
```

#### 1.3 Retry Logic Utility
**File:** `lib/integrations/retry.ts`

```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  // Exponential backoff implementation
  // Configurable retry attempts
  // Specific error handling
}
```

#### 1.4 Integration Status Dashboard
**File:** `app/admin/integrations/page.tsx`

- View status of all integrations (connected/disconnected)
- Last sync timestamp
- Error logs
- Manual sync triggers
- Health check results

#### 1.5 Audit Logging
**File:** `lib/integrations/audit.ts`

- Log all API requests
- Log all responses
- Track request duration
- Store in database for compliance

---

## 🏥 Priority 2: WinFlex Integration - Life Insurance Quotes (Sprint 9 - Week 17-18)

### **Overview:**
WinFlex provides instant life insurance quotes from multiple carriers. This is the highest priority integration as life insurance is the core business.

### **API Capabilities:**
- Term Life quotes (10, 15, 20, 25, 30 year terms)
- Whole Life quotes
- Universal Life quotes
- Multi-carrier comparison
- Real-time premium calculations

### **Deliverables:**

#### 2.1 WinFlex API Client
**File:** `lib/integrations/winflex/client.ts`

```typescript
export class WinFlexClient extends BaseIntegration {
  name = 'WinFlex';
  baseUrl = process.env.WINFLEX_BASE_URL;

  async getQuote(request: WinFlexQuoteRequest): Promise<WinFlexQuote[]> {
    // Call WinFlex API
    // Transform response
    // Return standardized quote format
  }

  async getCarriers(): Promise<Carrier[]> {
    // Fetch available carriers
  }

  async getProducts(carrierId: string): Promise<Product[]> {
    // Fetch carrier products
  }
}
```

#### 2.2 Quote Request Interface
**File:** `lib/integrations/winflex/types.ts`

```typescript
export interface WinFlexQuoteRequest {
  applicant: {
    age: number;
    gender: 'Male' | 'Female';
    state: string;
    tobacco: boolean;
    healthClass: 'Preferred Plus' | 'Preferred' | 'Standard Plus' | 'Standard';
  };
  product: {
    type: 'Term' | 'Whole Life' | 'Universal Life';
    term?: number; // For term life
    faceAmount: number;
  };
  carriers?: string[]; // Optional carrier filter
}

export interface WinFlexQuote {
  carrierId: string;
  carrierName: string;
  productName: string;
  monthlyPremium: number;
  annualPremium: number;
  guaranteedYears: number;
  ratings: {
    amBest: string;
    sp: string;
    moodys: string;
  };
}
```

#### 2.3 API Route
**File:** `app/api/quotes/life/route.ts`

```typescript
import { WinFlexClient } from '@/lib/integrations/winflex/client';

export async function POST(request: Request) {
  const body = await request.json();

  // Validate request
  const quoteRequest = WinFlexQuoteRequestSchema.parse(body);

  // Call WinFlex
  const client = new WinFlexClient();
  const quotes = await client.getQuote(quoteRequest);

  // Save to database
  await prisma.quote.create({
    data: {
      type: 'LIFE',
      request: quoteRequest,
      results: quotes,
      userId: session.user.id,
    },
  });

  return Response.json({ quotes });
}
```

#### 2.4 Quote Comparison UI
**File:** `app/quotes/life/page.tsx`

- Form for quote input (age, gender, amount, term, etc.)
- Display quote results in sortable table
- Filter by carrier, price, ratings
- Save quote to database
- Send quote via email
- Generate PDF illustration
- Convert quote to application

---

## 📊 Priority 3: iPipeline Integration - Term Quotes & Applications (Sprint 10 - Week 19-20)

### **Overview:**
iPipeline provides term life quotes and electronic application submission capabilities.

### **API Capabilities:**
- Term life quotes
- Electronic application submission
- Underwriting pre-screen (X-Ray)
- Application status tracking
- Document upload

### **Deliverables:**

#### 3.1 iPipeline API Client
**File:** `lib/integrations/ipipeline/client.ts`

```typescript
export class IPipelineClient extends BaseIntegration {
  name = 'iPipeline';
  baseUrl = process.env.IPIPELINE_BASE_URL;

  async getTermQuote(request: TermQuoteRequest): Promise<TermQuote[]> {
    // Call iPipeline API
  }

  async submitApplication(app: Application): Promise<ApplicationResponse> {
    // Submit electronic application
  }

  async getApplicationStatus(appId: string): Promise<ApplicationStatus> {
    // Check application status
  }

  async uploadDocument(appId: string, doc: File): Promise<DocumentUpload> {
    // Upload supporting document
  }
}
```

#### 3.2 Application Submission UI
**File:** `app/applications/new/page.tsx`

- Multi-step application form
- Pre-fill from quote data
- Real-time validation
- Document upload interface
- E-signature integration
- Submit to iPipeline
- Track submission status

#### 3.3 Application Status Tracking
**File:** `app/cases/[id]/page.tsx` (enhance existing)

- Display iPipeline application status
- Show pending requirements
- Upload additional documents
- View underwriting notes
- Track timeline

---

## 💰 Priority 4: RateWatch Integration - Annuity Quotes (Sprint 10 - Week 19-20)

### **Overview:**
RateWatch provides annuity rate comparisons across multiple carriers.

### **API Capabilities:**
- Fixed annuity rates
- Fixed indexed annuity rates
- Multi-year guaranteed annuities (MYGA)
- Carrier details and ratings
- Product features comparison

### **Deliverables:**

#### 4.1 RateWatch API Client
**File:** `lib/integrations/ratewatch/client.ts`

```typescript
export class RateWatchClient extends BaseIntegration {
  name = 'RateWatch';
  baseUrl = process.env.RATEWATCH_BASE_URL;

  async getAnnuityRates(request: AnnuityQuoteRequest): Promise<AnnuityQuote[]> {
    // Fetch annuity rates
  }

  async getProductDetails(productId: string): Promise<ProductDetails> {
    // Get detailed product information
  }
}
```

#### 4.2 Annuity Quote UI
**File:** `app/quotes/annuity/page.tsx`

- Form for annuity quote input
- Display rate comparison table
- Sort by rate, carrier, features
- Product detail modal
- Save quote
- Generate illustration
- Send via email

---

## 📝 Priority 5: iGo eApp Integration - Electronic Applications (Sprint 11 - Week 21-22)

### **Overview:**
iGo eApp enables electronic application submission for life insurance.

### **API Capabilities:**
- Electronic application submission
- Pre-fill application data
- E-signature workflow
- Application status tracking

### **Deliverables:**

#### 5.1 iGo eApp Client
**File:** `lib/integrations/igo-eapp/client.ts`

```typescript
export class IGoEAppClient extends BaseIntegration {
  name = 'iGo eApp';
  baseUrl = process.env.IGO_EAPP_BASE_URL;

  async submitApplication(app: LifeApplication): Promise<ApplicationResponse> {
    // Submit life insurance application
  }

  async getSignatureUrl(appId: string): Promise<string> {
    // Get e-signature URL
  }
}
```

#### 5.2 Integration with Case Management
**File:** `app/cases/[id]/page.tsx` (enhance existing)

- "Submit to iGo eApp" button
- Pre-fill from case data
- Launch e-signature workflow
- Track submission status

---

## 🔥 Priority 6: Firelight Integration - Annuity Submissions (Sprint 11 - Week 21-22)

### **Overview:**
Firelight handles annuity application submissions.

### **API Capabilities:**
- Annuity application submission
- Suitability form generation
- Transfer/rollover tracking
- Application status tracking

### **Deliverables:**

#### 6.1 Firelight Client
**File:** `lib/integrations/firelight/client.ts`

```typescript
export class FirelightClient extends BaseIntegration {
  name = 'Firelight';
  baseUrl = process.env.FIRELIGHT_BASE_URL;

  async submitAnnuityApplication(app: AnnuityApplication): Promise<ApplicationResponse> {
    // Submit annuity application
  }

  async createSuitabilityForm(data: SuitabilityData): Promise<SuitabilityForm> {
    // Generate suitability form
  }
}
```

#### 6.2 Annuity Application UI
**File:** `app/applications/annuity/page.tsx`

- Annuity application form
- Suitability questionnaire
- Transfer/rollover details
- Submit to Firelight

---

## 📧 Priority 7: Email & PDF Generation (Sprint 12 - Week 23-24)

### **Overview:**
Enable automated document generation and email delivery.

### **Deliverables:**

#### 7.1 Resend Email Integration
**File:** `lib/email/client.ts`

```typescript
import { Resend } from 'resend';

export async function sendQuoteEmail(
  to: string,
  quote: Quote,
  pdf: Buffer
): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: 'quotes@valorfinancial.com',
    to,
    subject: 'Your Insurance Quote',
    html: quoteEmailTemplate(quote),
    attachments: [{
      filename: 'quote.pdf',
      content: pdf,
    }],
  });
}
```

#### 7.2 PDF Generation
**File:** `lib/pdf/quote-generator.ts`

```typescript
import PDFDocument from 'pdfkit';

export async function generateQuotePDF(quote: Quote): Promise<Buffer> {
  const doc = new PDFDocument();

  // Add company logo
  // Add quote details
  // Add carrier comparison table
  // Add agent information
  // Add disclaimers

  return doc;
}
```

#### 7.3 Email Templates
**File:** `lib/email/templates/`

- Quote email template
- Application confirmation template
- Status update template
- Document request template

---

## 🔍 Testing Strategy

### **Unit Tests:**
- Test each integration client independently
- Mock API responses
- Test error handling
- Test retry logic

### **Integration Tests:**
- Test end-to-end quote flow
- Test application submission flow
- Test email delivery
- Test PDF generation

### **Manual Testing:**
- Test with real API credentials (sandbox)
- Verify data transformation
- Check UI updates
- Validate error messages

---

## 📊 Success Metrics

### **Phase 4 Completion Criteria:**
- ✅ All 7 integrations implemented
- ✅ Quote-to-application workflow functional
- ✅ PDF generation working
- ✅ Email delivery working
- ✅ Integration dashboard operational
- ✅ Error handling robust
- ✅ Documentation complete
- ✅ 0 TypeScript errors
- ✅ All tests passing

### **Performance Targets:**
- Quote generation: <5 seconds
- Application submission: <10 seconds
- PDF generation: <3 seconds
- Email delivery: <5 seconds
- API uptime: >99.5%

### **Quality Targets:**
- Test coverage: >80%
- Error rate: <1%
- Successful quote rate: >95%
- Successful submission rate: >90%

---

## 🚨 Risk Assessment

### **High Risk:**
1. **API Credential Access** - May need to wait for vendor credentials
   - **Mitigation:** Build with mock APIs first, swap in real APIs later

2. **API Rate Limits** - Third-party APIs may have usage limits
   - **Mitigation:** Implement caching, rate limiting, and queue system

3. **API Downtime** - Third-party services may be unavailable
   - **Mitigation:** Implement fallback options, retry logic, user notifications

### **Medium Risk:**
1. **Data Transformation Complexity** - APIs may return unexpected formats
   - **Mitigation:** Robust error handling, extensive logging

2. **Integration Testing** - Difficult to test without production access
   - **Mitigation:** Use sandbox environments, mock comprehensive responses

---

## 📅 Sprint Breakdown

### **Sprint 9 (Week 17-18): Foundation + WinFlex**
- Week 17: Integration framework, base classes, config system
- Week 18: WinFlex integration, quote UI, testing

### **Sprint 10 (Week 19-20): iPipeline + RateWatch**
- Week 19: iPipeline quotes and applications
- Week 20: RateWatch annuity rates

### **Sprint 11 (Week 21-22): iGo eApp + Firelight**
- Week 21: iGo eApp electronic applications
- Week 22: Firelight annuity submissions

### **Sprint 12 (Week 23-24): Email + PDF + Polish**
- Week 23: PDF generation, email delivery
- Week 24: Integration dashboard, documentation, testing

---

## 📦 Dependencies to Install

```bash
# Email service
npm install resend

# PDF generation
npm install pdfkit @types/pdfkit

# HTTP client (if not using fetch)
npm install axios

# Environment validation
npm install zod

# Testing
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev jest @types/jest
```

---

## 🔗 Related Documents

- [PHASE_3_SUMMARY.md](./PHASE_3_SUMMARY.md) - Phase 3 deliverables
- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) - Overall project plan
- [Prisma Schema](./prisma/schema.prisma) - Database structure
- [app-prd.mdc](./app-prd.mdc) - Product requirements

---

**Created:** November 17, 2025
**Version:** 1.0
**Status:** Planning Complete - Ready to Begin Implementation

---

*This plan will guide Phase 4 implementation. Progress will be tracked in DEVELOPMENT_PLAN.md and a Phase 4 summary document will be created upon completion.*
