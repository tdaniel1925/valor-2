# Valor Financial Specialists - Multi-Tenant Insurance SaaS Platform

A modern, multi-tenant SaaS insurance back office platform built for insurance agencies. This platform consolidates multiple third-party systems into a single, intuitive interface with enterprise-grade features, Stripe subscription billing, and SmartOffice Intelligence.

## 🚀 Tech Stack

- **Framework**: Next.js 16.0.3 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Authentication**: Supabase Auth with 90-day persistent sessions
- **Payments**: Stripe for subscription billing
- **State Management**: React Query (@tanstack/react-query)
- **Form Handling**: React Hook Form + Zod validation

## ✨ New Features (Latest Release)

### 🏢 Multi-Tenant SaaS Architecture
- **Subdomain-based tenancy**: Each agency gets their own subdomain (e.g., `agency-name.valorfs.com`)
- **Three subscription tiers**: Starter ($99/mo), Professional ($299/mo), Enterprise ($999/mo)
- **14-day free trial**: No credit card charged during trial period
- **Automatic provisioning**: Tenant and owner account created on successful checkout
- **Usage limits**: Users, storage, and feature access based on subscription plan
- **White label support**: Enterprise tier includes custom branding capabilities

### 💳 Stripe Integration
- **Secure checkout**: Stripe-hosted checkout for PCI compliance
- **Subscription management**: Full lifecycle management (create, upgrade, downgrade, cancel)
- **Customer portal**: Self-service billing portal for payment methods, invoices, and subscriptions
- **Webhook handling**: Real-time subscription updates via Stripe webhooks
- **Trial period**: 14-day free trial with automatic conversion to paid
- **Failed payment handling**: Automatic retry logic and grace period

### 🔐 90-Day Persistent Sessions
- **Long-lived auth**: Users stay logged in for 90 days automatically
- **Remember me**: Option on login page (checked by default)
- **Secure cookies**: httpOnly, secure (production), sameSite=lax
- **Client + Server**: Consistent session handling across SSR and client components

### 📊 SmartOffice Intelligence Dashboard
- **Professional UI/UX**: Enterprise-grade design with gradient backgrounds
- **Real-time metrics**: Total policies, premium, active cases, and revenue
- **Trend indicators**: Visual up/down trends with percentage changes
- **Interactive charts**: 2x2 grid layout with responsive design
- **Enhanced tables**: Zebra striping, hover effects, sticky headers, improved readability
- **Smooth animations**: Hover effects, transitions, and micro-interactions

## 📋 Features

### Latest Release - Multi-Tenant SaaS ✅
- ✅ Multi-tenant architecture with subdomain routing
- ✅ Stripe subscription billing (3 tiers)
- ✅ Tenant self-signup with plan selection
- ✅ Stripe Customer Portal integration
- ✅ 14-day free trial period
- ✅ Billing management dashboard
- ✅ Webhook-driven subscription lifecycle
- ✅ 90-day persistent auth sessions
- ✅ SmartOffice Intelligence dashboard redesign
- ✅ Enterprise-grade UI/UX

### Phase 1 - Foundation ✅
- ✅ Next.js 16 project setup with TypeScript
- ✅ Tailwind CSS configuration
- ✅ Supabase authentication integration
- ✅ Prisma ORM setup with comprehensive schema
- ✅ Protected routes with middleware
- ✅ Login/authentication pages
- ✅ Basic dashboard layout
- ✅ Running on port 3006

### Database Schema Implemented
- **Tenants**: Multi-tenant SaaS with Stripe subscription fields
- **Users & Profiles**: Complete user management with roles (Agent, Manager, Admin, Executive)
- **Organizations**: Hierarchical organization structure
- **Contracts**: Carrier contract management
- **Quotes**: Multi-type insurance quotes (Term, Whole Life, Annuities, etc.)
- **Cases**: Application and case tracking
- **Commissions**: Commission tracking and splits
- **Notifications**: User notification system
- **Audit Logs**: Complete audit trail

### Planned Features (From PRD)
- 🔄 Production tracking and analytics
- 🔄 Multi-carrier quoting engine (WinFlex, iPipeline, RateWatch)
- 🔄 Electronic applications (iGo, Firelight)
- 🔄 Case management system
- 🔄 Contract request workflow
- 🔄 Commission reporting
- 🔄 Training and resources (GoCollab)
- 🔄 Custom report builder
- 🔄 Third-party integrations (3Mark, SuranceBay, etc.)

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (Supabase account)
- Stripe account (for subscription billing)
- Git

### Installation

1. **Clone the repository** (if using Git):
```bash
git clone <repository-url>
cd valor-2
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:

   The project uses both `.env` (for Prisma) and `.env.local` (for Next.js).

   Copy `.env.example` to `.env.local` and fill in the required values:
   ```bash
   cp .env.example .env.local
   ```

   Required variables:
   - Supabase credentials (URL, keys, database URLs)
   - Stripe API keys (test mode initially)
   - Stripe price IDs for subscription plans
   - Stripe webhook secret

4. **Run database migrations**:

   If you encounter permission issues with automatic migrations, manually run the SQL script:
   ```bash
   # Copy contents of prisma/migrations/manual_add_stripe_fields.sql
   # Paste into Supabase SQL Editor and execute
   ```

   Then generate the Prisma client:
   ```bash
   npx prisma generate
   ```

5. **Set up Stripe** (detailed instructions in `STRIPE-SETUP.md`):
   - Create Stripe products and prices
   - Configure webhook endpoint (use Stripe CLI for local dev)
   - Add price IDs to environment variables

6. **Start the development server**:
```bash
npm run dev
```

The application will be available at [http://localhost:3006](http://localhost:3006)

## 📝 Available Scripts

- `npm run dev` - Start development server on port 3006
- `npm run build` - Build for production
- `npm run start` - Start production server on port 3006
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Create new database migration
- `npx prisma generate` - Generate Prisma Client

## 🗂️ Project Structure

```
valor-2/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication group
│   │   └── login/           # Login page (90-day sessions)
│   ├── (public)/            # Public pages group
│   │   └── signup/
│   │       ├── tenant/      # Tenant signup page
│   │       └── success/     # Signup success page
│   ├── api/                 # API routes
│   │   ├── auth/            # Auth endpoints
│   │   ├── stripe/          # Stripe endpoints
│   │   │   ├── create-checkout/  # Create Stripe checkout
│   │   │   └── create-portal-session/  # Customer portal
│   │   ├── webhooks/        # Webhook handlers
│   │   │   └── stripe/      # Stripe webhook handler
│   │   └── tenants/         # Tenant management
│   ├── dashboard/           # Dashboard page
│   ├── smartoffice/         # SmartOffice Intelligence
│   ├── settings/            # Settings pages
│   │   └── billing/         # Billing management
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/              # Reusable React components
│   ├── billing/             # Billing components
│   │   └── BillingContent.tsx
│   ├── smartoffice/         # SmartOffice components
│   │   └── DashboardContent.tsx
│   └── ui/                  # UI components
├── lib/                     # Library code
│   ├── auth/                # Authentication utilities
│   │   ├── supabase-client.ts  # Client (90-day sessions)
│   │   └── supabase-server.ts  # Server (90-day sessions)
│   ├── stripe/              # Stripe integration
│   │   └── stripe-server.ts # Stripe utilities
│   ├── db/                  # Database utilities
│   │   └── prisma.ts        # Prisma client instance
│   ├── api/                 # API client utilities
│   ├── utils/               # Helper functions
│   └── validations/         # Zod schemas
├── prisma/                  # Prisma configuration
│   ├── schema.prisma        # Database schema (with Tenant model)
│   └── migrations/          # Database migrations
│       └── manual_add_stripe_fields.sql  # Manual Stripe migration
├── types/                   # TypeScript type definitions
├── hooks/                   # Custom React hooks
├── middleware.ts            # Next.js middleware (tenant + auth)
├── .env                     # Environment variables (Prisma)
├── .env.local               # Environment variables (Next.js)
├── STRIPE-SETUP.md          # Stripe setup instructions
└── package.json             # Project dependencies
```

## 🔒 Authentication

The platform uses Supabase Authentication with support for:
- Email/password login
- Google OAuth (configured)
- Multi-factor authentication (MFA)
- **90-day persistent sessions** with "Remember Me" option
- Session management with automatic refresh
- Secure httpOnly cookies

Protected routes are automatically secured via Next.js middleware.

## 💰 Subscription Plans & Billing

### Plans Overview

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| **Price** | $99/month | $299/month | $999/month |
| **Users** | 5 | 25 | Unlimited |
| **Storage** | 10GB | 50GB | 500GB |
| **Free Trial** | 14 days | 14 days | 14 days |
| **SmartOffice Intelligence** | ❌ | ✅ | ✅ |
| **White Label Branding** | ❌ | ❌ | ✅ |
| **Support** | Email | Email + Phone | 24/7 + Dedicated Manager |

### Key Features
- **Self-service signup**: Public signup page at `/signup/tenant`
- **Subdomain provisioning**: Automatic subdomain creation (e.g., `agency-name.valorfs.com`)
- **14-day free trial**: No credit card charged during trial
- **Stripe-powered billing**: Secure payment processing and subscription management
- **Customer portal**: Self-service billing management
- **Automatic provisioning**: Tenant + owner account created on successful payment
- **Usage enforcement**: Automatic limits based on subscription tier

### Setup Instructions
For detailed Stripe configuration, see **[STRIPE-SETUP.md](./STRIPE-SETUP.md)**

## 🔌 API Endpoints

### Stripe & Billing

#### `POST /api/stripe/create-checkout`
Creates a Stripe Checkout session for new tenant signup.

**Request Body:**
```json
{
  "plan": "starter" | "professional" | "enterprise",
  "agencyName": "string",
  "subdomain": "string",
  "ownerEmail": "string",
  "ownerFirstName": "string",
  "ownerLastName": "string",
  "ownerPassword": "string"
}
```

**Response:**
```json
{
  "sessionId": "cs_...",
  "url": "https://checkout.stripe.com/..."
}
```

#### `POST /api/stripe/create-portal-session`
Creates a Stripe Customer Portal session for managing subscriptions.

**Authentication:** Required (tenant owner only)

**Request Body:**
```json
{
  "returnUrl": "https://yourapp.com/settings/billing"
}
```

**Response:**
```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

#### `POST /api/webhooks/stripe`
Handles Stripe webhook events (called by Stripe, not your app).

**Events Handled:**
- `checkout.session.completed` - Creates tenant and owner account
- `customer.subscription.updated` - Updates subscription status
- `customer.subscription.deleted` - Handles cancellations
- `invoice.payment_failed` - Marks tenant as past due

### Tenant Management

#### `GET /api/tenants/check-subdomain?subdomain=example`
Checks if a subdomain is available for tenant signup.

**Response:**
```json
{
  "available": true | false
}
```

## 🗄️ Database

### Schema Overview

**Core Entities:**
- `Tenant` - Multi-tenant organizations with Stripe subscription data
  - Basic: name, slug, subdomain, domain
  - Subscription: plan, status (TRIAL, ACTIVE, PAST_DUE, CANCELED)
  - Stripe: customerId, subscriptionId, priceId, subscriptionStatus
  - Limits: maxUsers, maxStorageGB, currentPeriodEnd
- `User` - User accounts with roles and tenant association
- `UserProfile` - Extended user information (licenses, preferences)
- `Organization` - Hierarchical organization structure
- `OrganizationMember` - User-organization relationships
- `Contract` - Carrier contracts and commission levels
- `Quote` - Insurance quotes (all product types)
- `Case` - Applications and case management
- `CaseNote` - Case communication and notes
- `Commission` - Commission tracking and payments
- `Notification` - User notifications
- `AuditLog` - Complete audit trail

### Running Migrations

**Note**: The initial migration requires valid database credentials. Update the `.env` file with correct Supabase credentials, then run:

```bash
npx prisma migrate dev --name initial_schema
```

## 🔐 Environment Variables

Required environment variables are defined in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database (Prisma)
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url

# Stripe (required for subscription billing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PROFESSIONAL_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3006

# Optional Integrations
WINFLEX_API_KEY=
IPIPELINE_API_KEY=
RATEWATCH_API_KEY=
# ... (more integrations)
```

**Important**: See `STRIPE-SETUP.md` for detailed Stripe configuration instructions.

## 📚 Key Technologies

### Next.js 16
- App Router with React Server Components
- Server Actions for mutations
- Middleware for authentication
- Turbopack for faster builds

### Prisma ORM
- Type-safe database queries
- Automatic migrations
- Prisma Studio for database management

### Supabase
- PostgreSQL database
- Authentication & user management
- Real-time subscriptions (planned)
- File storage (planned)

## 🎯 Development Roadmap

Based on the PRD, the development is organized into phases:

**Phase 0: Multi-Tenant SaaS Foundation** ✅ (COMPLETED - March 2026)
- ✅ Multi-tenant architecture with subdomain routing
- ✅ Stripe subscription billing (Starter, Professional, Enterprise)
- ✅ Tenant self-signup and provisioning
- ✅ 14-day free trial implementation
- ✅ Webhook-driven subscription lifecycle
- ✅ Customer billing portal
- ✅ 90-day persistent auth sessions
- ✅ SmartOffice Intelligence dashboard redesign

**Phase 1: Foundation** ✅ (COMPLETED)
- Project setup
- Authentication
- Database schema
- Basic dashboard

**Phase 2: Core Features** ✅ (COMPLETED)
- User management
- Production tracking
- Analytics dashboard
- Mobile-responsive UI

**Phase 3: Business Operations** ✅ (COMPLETED)
- Contract management
- Quoting engine
- Application submission
- Commission tracking

**Phase 4: Integrations** ✅ (COMPLETED)
- ✅ RateWatch API integration (Annuity quotes)
- ✅ WinFlex API integration (Life insurance quotes)
- ✅ iPipeline API integration (Term life & e-applications)
- ✅ Unified quote aggregation service
- ✅ Webhook handler system
- ✅ Integration health monitoring
- ✅ API endpoints for all integrations

**Phase 5: Reporting & Analytics** 🔄 (IN PROGRESS)
- Custom report builder
- Business intelligence
- Performance metrics

**Phase 6: Security & Testing** 📋 (PLANNED)
- Security hardening
- Performance optimization
- Comprehensive testing

**Phase 7: Production Deployment** 📋 (PLANNED)
- Domain configuration
- SSL certificates
- Monitoring setup
- Production documentation

## 🤝 Contributing

This is a private project for Valor Financial Specialists. Development is managed by BotMakers, Inc.

## 📄 License

UNLICENSED - Private and proprietary

## 🆘 Support

For issues or questions, contact the development team.

---

**Built with ❤️ by BotMakers, Inc.**

Last Updated: March 2026
