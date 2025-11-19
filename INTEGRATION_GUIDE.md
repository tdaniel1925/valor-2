# Third-Party Integration Guide

This document provides comprehensive information about all third-party integrations in the Valor Insurance Platform.

## Table of Contents

1. [Overview](#overview)
2. [Integration Architecture](#integration-architecture)
3. [WinFlex - Life Insurance Quoting](#winflex---life-insurance-quoting)
4. [iPipeline - Term Life Quoting](#ipipeline---term-life-quoting)
5. [RateWatch - Annuity Rates](#ratewatch---annuity-rates)
6. [iGO - Life Insurance E-Applications](#igo---life-insurance-e-applications)
7. [FireLight - Annuity Applications](#firelight---annuity-applications)
8. [Configuration & Setup](#configuration--setup)
9. [Webhook Handlers](#webhook-handlers)
10. [Testing & Mock Mode](#testing--mock-mode)

---

## Overview

The Valor Insurance Platform integrates with five major insurance technology providers to deliver end-to-end insurance sales capabilities:

| Provider | Purpose | Products Covered | Status |
|----------|---------|-----------------|--------|
| **WinFlex** (Ebix) | Life insurance quoting | Term, Whole, Universal Life | ✅ Ready |
| **iPipeline** | Term life quoting | Term Life | ✅ Ready |
| **RateWatch** | Annuity rate comparison | All annuity types | ✅ Ready |
| **iGO** (iPipeline) | Life insurance e-applications | All life products | ✅ Ready |
| **FireLight** (Hexure) | Annuity applications | All annuity types | ✅ Ready |

---

## Integration Architecture

### Quote Aggregation

The platform uses a unified quote aggregation service that:
- Fetches quotes from multiple providers in parallel
- Normalizes quote data to a unified format
- Applies filtering and sorting
- Monitors provider health
- Handles failures gracefully with mock data fallback

### Application Submission

Two dedicated e-application systems:
- **iGO**: Life insurance applications with e-signature support
- **FireLight**: Annuity applications with ACORD XML and DTCC integration

### Webhook System

Centralized webhook handler that:
- Routes events to appropriate handlers
- Validates webhook signatures
- Logs all events to audit trail
- Supports WinFlex, iPipeline, and RateWatch webhooks

---

## WinFlex - Life Insurance Quoting

### Provider Information

- **Company**: Ebix WinFlex
- **Purpose**: Multi-carrier life insurance quote comparison
- **Website**: https://www.ebix.com/winflex
- **Access**: Through FMO/BGA partnership

### Products Supported

- Term Life Insurance
- Whole Life Insurance
- Universal Life Insurance
- Indexed Universal Life (IUL)
- Variable Universal Life (VUL)

### API Capabilities

✅ **Real-time quotes** from 100+ carriers
✅ **Product comparisons** across multiple carriers
✅ **Rate class determination** based on health factors
✅ **Illustration generation** (PDF)
✅ **Carrier ratings** (AM Best)
✅ **Webhook notifications** for rate changes

### Required Credentials

```env
WINFLEX_API_KEY=your-api-key
WINFLEX_API_SECRET=your-api-secret
WINFLEX_PARTNER_ID=your-partner-id
WINFLEX_BASE_URL=https://api.ebix.com/winflex/v1
WINFLEX_ENABLED=true
WINFLEX_WEBHOOK_SECRET=your-webhook-secret
```

### How to Obtain Access

1. Partner with an FMO/BGA that has WinFlex access
2. Request API credentials from your FMO/BGA
3. Complete Ebix developer onboarding
4. Receive API key and partner ID
5. Configure webhook endpoints

### Sample Request

```typescript
import { winFlexClient } from '@/lib/integrations/winflex/client';

const quotes = await winFlexClient.getQuotes({
  applicant: {
    age: 35,
    gender: 'Male',
    state: 'CA',
    tobacco: 'Never',
    healthClass: 'Preferred Plus',
  },
  product: {
    type: 'Term',
    faceAmount: 500000,
    term: 20,
  },
});
```

### Webhook Events

- `quote.created` - New quote generated
- `quote.expired` - Quote has expired
- `carrier.updated` - Carrier information changed
- `rate.changed` - Product rates updated

---

## iPipeline - Term Life Quoting

### Provider Information

- **Company**: iPipeline
- **Purpose**: Term life insurance quoting and e-applications
- **Website**: https://ipipeline.com
- **Access**: Direct partner agreement

### Products Supported

- Term Life Insurance (10, 15, 20, 25, 30 year terms)
- Return of Premium Term
- Convertible Term

### API Capabilities

✅ **Term life quotes** from major carriers
✅ **E-application support** via iGO integration
✅ **E-signature integration**
✅ **Application status tracking**
✅ **Reflexive questioning** for streamlined apps
✅ **Physician lookup** via HIPAASpace
✅ **Email validation** via Kickbox

### Required Credentials

```env
IPIPELINE_API_KEY=your-api-key
IPIPELINE_API_SECRET=your-api-secret
IPIPELINE_PARTNER_ID=your-partner-id
IPIPELINE_BASE_URL=https://api.ipipeline.com/v1
IPIPELINE_ENABLED=true
IPIPELINE_WEBHOOK_SECRET=your-webhook-secret
```

### How to Obtain Access

1. Contact iPipeline Sales: sales@ipipeline.com
2. Complete partnership agreement
3. Access iPipeline Customer Portal: customerportal.ipipeline.com
4. Download API documentation
5. Request sandbox credentials
6. Complete certification process
7. Receive production credentials

### Sample Request

```typescript
import { iPipelineClient } from '@/lib/integrations/ipipeline/client';

const quotes = await iPipelineClient.getTermQuotes({
  applicant: {
    age: 40,
    gender: 'Female',
    state: 'TX',
    tobacco: 'Never',
    healthClass: 'Preferred',
  },
  product: {
    type: 'Term',
    faceAmount: 1000000,
    term: 20,
  },
});
```

### Webhook Events

- `quote.generated` - Quote successfully created
- `quote.expired` - Quote has expired

---

## RateWatch - Annuity Rates

### Provider Information

- **Company**: AnnuityRateWatch (Sunderland Group)
- **Purpose**: Comprehensive annuity rate comparison
- **Website**: https://www.annuityratewatch.com
- **Access**: API subscription

### Products Supported

- Multi-Year Guaranteed Annuities (MYGA)
- Fixed Annuities
- Fixed Indexed Annuities (FIA)
- Registered Index-Linked Annuities (RILA)
- Variable Annuities
- Single Premium Immediate Annuities (SPIA)
- Lifetime Income Riders

### Coverage

- **3,000+ annuity products**
- **100+ insurance carriers**
- **All 50 states**
- **Daily rate updates**

### API Capabilities

✅ **Rate comparisons** across all annuity types
✅ **Product details** with full feature breakdown
✅ **Carrier ratings** (AM Best)
✅ **Historical rate data**
✅ **Lifetime income quoting**
✅ **Surrender schedule** information
✅ **State availability** checking
✅ **Webhook notifications** for rate changes

### Required Credentials

```env
RATEWATCH_API_KEY=your-api-key
RATEWATCH_API_SECRET=your-api-secret
RATEWATCH_BASE_URL=https://api.annuityratewatch.com/v1
RATEWATCH_ENABLED=true
RATEWATCH_WEBHOOK_SECRET=your-webhook-secret
```

### How to Obtain Access

1. Visit: https://www.annuityratewatch.com/subscriptions
2. Select "Annuity API" subscription
3. Complete subscription form
4. Receive API credentials via email
5. Access developer documentation
6. Test in sandbox environment

### Sample Request

```typescript
import { rateWatchClient } from '@/lib/integrations/ratewatch/client';

const quotes = await rateWatchClient.getQuotes({
  annuityType: AnnuityType.MYGA,
  premium: 100000,
  term: 5,
  state: 'FL',
  age: 65,
  qualified: true,
});
```

### Webhook Events

- `rate.updated` - Product rate changed
- `product.available` - New product added
- `product.discontinued` - Product no longer available

---

## iGO - Life Insurance E-Applications

### Provider Information

- **Company**: iPipeline (iGO e-App)
- **Purpose**: Electronic life insurance application submission
- **Website**: https://ipipeline.com/products/igo
- **Access**: iPipeline partnership (same as iPipeline above)

### Capabilities

✅ **100% good order submissions** - Reflexive questioning ensures completeness
✅ **E-signature integration** - DocuSign-like experience
✅ **Pre-fill from quotes** - Automatically populate from quote data
✅ **Physician lookup** - HIPAASpace integration
✅ **Email validation** - Kickbox integration
✅ **Bank account verification** - Real-time ACH validation
✅ **Application status tracking** - Real-time updates
✅ **Requirement management** - Track APS, exams, etc.

### Application Types

- Term Life
- Whole Life
- Universal Life
- Indexed Universal Life
- Variable Life

### Required Credentials

```env
IGO_API_KEY=your-api-key
IGO_API_SECRET=your-api-secret
IGO_PARTNER_ID=your-partner-id
IGO_BASE_URL=https://api.ipipeline.com/igo/v1
IGO_ENVIRONMENT=sandbox # or production
IGO_ENABLED=true
```

### How to Obtain Access

Same process as iPipeline (they're the same company). Access to iPipeline APIs includes iGO e-App.

### Sample Request

```typescript
import { iGoClient } from '@/lib/integrations/igo/client';

const application = await iGoClient.createApplication({
  carrierId: 'CARRIER123',
  carrierName: 'Example Life',
  productId: 'PROD456',
  productName: 'Term 20',
  productType: ApplicationType.TERM_LIFE,
  faceAmount: 500000,
  term: 20,
  applicant: {
    firstName: 'John',
    lastName: 'Doe',
    ssn: '123-45-6789',
    dateOfBirth: '1985-06-15',
    // ... more applicant details
  },
  beneficiaries: [/* ... */],
  payment: {/* ... */},
  // ... more application details
});
```

### Webhook Events

- `application.submitted` - Application submitted to carrier
- `application.approved` - Application approved
- `application.declined` - Application declined
- `application.issued` - Policy issued
- `requirement.received` - New requirement requested
- `requirement.completed` - Requirement fulfilled
- `status.change` - Application status changed
- `esignature.completed` - E-signature process completed

---

## FireLight - Annuity Applications

### Provider Information

- **Company**: Hexure (FireLight)
- **Purpose**: Electronic annuity application submission
- **Website**: https://hexure.com/insurance-sales-software/e-application
- **Access**: Hexure partnership

### Capabilities

✅ **Annuity e-applications** - All annuity types
✅ **Suitability forms** - Built-in suitability questionnaires
✅ **1035 exchange support** - Tax-free exchange processing
✅ **IRA rollover tracking** - Qualified plan transfers
✅ **ACORD XML generation** - Industry standard format
✅ **DTCC integration** - Depository Trust & Clearing Corporation
✅ **Multi-party signatures** - Owner, annuitant, agent
✅ **State-specific forms** - Automatic form selection
✅ **E-signature workflow** - Embedded signature process

### Annuity Types

- Fixed Annuities
- Fixed Indexed Annuities (FIA)
- Variable Annuities
- RILA (Registered Index-Linked Annuities)
- Immediate Annuities (SPIA)
- Deferred Annuities
- MYGA (Multi-Year Guaranteed Annuities)

### Required Credentials

```env
FIRELIGHT_API_KEY=your-api-key
FIRELIGHT_API_SECRET=your-api-secret
FIRELIGHT_PARTNER_ID=your-partner-id
FIRELIGHT_BASE_URL=https://api.hexure.com/firelight/v1
FIRELIGHT_ENVIRONMENT=sandbox # or production
FIRELIGHT_ENABLED=true
```

### How to Obtain Access

1. Contact Hexure Sales: contact through website
2. Complete partnership application
3. Sign license agreement
4. Receive sandbox credentials
5. Complete integration certification
6. Receive production credentials

### Sample Request

```typescript
import { fireLightClient } from '@/lib/integrations/firelight/client';

const application = await fireLightClient.createApplication({
  carrierId: 'CARRIER789',
  carrierName: 'Annuity Co',
  productId: 'ANNUITY123',
  productName: 'Fixed Index Annuity',
  annuityType: FireLightAnnuityType.FIXED_INDEXED,
  annuitant: {/* ... */},
  owner: {/* ... */},
  beneficiaries: [/* ... */],
  premium: {
    initialPremium: 250000,
    sourceOfFunds: '1035 Exchange',
    paymentMethod: '1035 Exchange',
    exchange1035: {
      existingCarrier: 'Old Carrier',
      policyNumber: 'POL123',
      accountValue: 250000,
      surrenderValue: 250000,
    },
  },
  suitability: {/* ... */},
  // ... more details
});
```

### Webhook Events

- `application.submitted` - Application submitted
- `application.approved` - Application approved
- `application.declined` - Application declined
- `application.issued` - Contract issued
- `contract.delivered` - Contract delivered to client
- `status.change` - Application status changed
- `esignature.completed` - All signatures collected
- `exchange.1035.received` - 1035 exchange funds received

---

## Configuration & Setup

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Configure Each Integration

Update `.env` with your credentials for each integration you want to enable.

### 3. Enable/Disable Integrations

Set `*_ENABLED=true` for each integration you want to activate. When disabled, the system uses mock data for development.

### 4. Test Connections

```typescript
import { quoteAggregator } from '@/lib/integrations/quote-aggregator';

// Check health of all integrations
const health = await quoteAggregator.getProvidersHealth();
console.log(health);
```

### 5. Configure Webhooks

Each provider needs webhook endpoints configured:

- **WinFlex**: `/api/webhooks/winflex`
- **iPipeline**: `/api/webhooks/ipipeline`
- **RateWatch**: `/api/webhooks/ratewatch`

In each provider's portal, set the webhook URL to:
```
https://your domain.com/api/webhooks/[provider-name]
```

---

## Webhook Handlers

### How Webhooks Work

1. Provider sends HTTP POST to your webhook endpoint
2. System validates webhook signature
3. Event is routed to appropriate handler
4. Handler processes the event
5. Event is logged to audit trail
6. Response sent back to provider

### Webhook Signature Validation

Each provider uses HMAC-SHA256 signature validation:

```typescript
// Webhook signature is verified automatically
// Configure webhook secrets in .env:
WINFLEX_WEBHOOK_SECRET="your-secret"
IPIPELINE_WEBHOOK_SECRET="your-secret"
RATEWATCH_WEBHOOK_SECRET="your-secret"
```

### Testing Webhooks Locally

Use a tool like ngrok to expose your local server:

```bash
ngrok http 3000
```

Then configure the ngrok URL in the provider's webhook settings.

---

## Testing & Mock Mode

### Mock Mode

All integrations support mock mode for development without API credentials:

- Set `*_ENABLED=false` in `.env`
- System automatically returns realistic mock data
- No API calls are made
- Perfect for UI development and testing

### Mock Data Features

✅ Realistic quote data with multiple carriers
✅ Application submission simulation
✅ Status change simulation
✅ Requirement tracking
✅ E-signature workflows
✅ Webhook event simulation

### Running Tests

```bash
# Test quote aggregation
npm run test:integrations

# Test individual providers
npm run test:winflex
npm run test:ipipeline
npm run test:ratewatch
npm run test:igo
npm run test:firelight
```

---

## API Rate Limits

| Provider | Rate Limit | Notes |
|----------|-----------|-------|
| WinFlex | 100 req/min | Per partner ID |
| iPipeline | 60 req/min | Per API key |
| RateWatch | 1000 req/hour | Burst: 100 req/min |
| iGO | 60 req/min | Per API key |
| FireLight | 60 req/min | Per partner ID |

---

## Support & Resources

### WinFlex
- **Support**: Through your FMO/BGA
- **Documentation**: Provided by FMO/BGA
- **Portal**: Access through FMO/BGA portal

### iPipeline & iGO
- **Support**: customerportal.ipipeline.com
- **Documentation**: customerportal.ipipeline.com/documentation
- **Email**: support@ipipeline.com
- **Phone**: 1-610-889-7000

### RateWatch
- **Support**: support@annuityratewatch.com
- **Documentation**: API docs provided with subscription
- **Website**: www.annuityratewatch.com

### FireLight (Hexure)
- **Support**: support@hexure.com
- **Documentation**: Partner portal
- **Website**: www.hexure.com

---

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Rotate API keys** every 90 days
3. **Use environment variables** for all credentials
4. **Validate webhook signatures** for all incoming webhooks
5. **Use HTTPS** for all API communications
6. **Log all integration events** to audit trail
7. **Monitor API usage** and rate limits
8. **Implement retry logic** with exponential backoff
9. **Handle PII data** according to compliance requirements
10. **Test in sandbox** before using production

---

## Troubleshooting

### Common Issues

**Issue**: "API key invalid"
- **Solution**: Verify credentials in `.env` file
- **Solution**: Check if API key has expired
- **Solution**: Confirm you're using correct environment (sandbox vs production)

**Issue**: "Rate limit exceeded"
- **Solution**: Implement request throttling
- **Solution**: Cache quote results where appropriate
- **Solution**: Contact provider for rate limit increase

**Issue**: "Webhook signature validation failed"
- **Solution**: Verify webhook secret matches provider settings
- **Solution**: Check request body is being read correctly
- **Solution**: Ensure no middleware is modifying the request

**Issue**: "Integration not responding"
- **Solution**: Check provider status page
- **Solution**: Verify network connectivity
- **Solution**: Check timeout settings
- **Solution**: Review API logs for error details

---

**Last Updated**: November 2025
**Version**: 1.0
