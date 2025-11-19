# Valor Financial Specialists - Insurance Back Office Platform

A modern, unified insurance back office platform built for insurance agents, managers, and executives. This platform consolidates multiple third-party systems into a single, intuitive interface.

## 🚀 Tech Stack

- **Framework**: Next.js 16.0.3 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Authentication**: Supabase Auth
- **State Management**: React Query (@tanstack/react-query)
- **Form Handling**: React Hook Form + Zod validation

## 📋 Features

### Phase 1 - Completed ✅
- ✅ Next.js 16 project setup with TypeScript
- ✅ Tailwind CSS configuration
- ✅ Supabase authentication integration
- ✅ Prisma ORM setup with comprehensive schema
- ✅ Protected routes with middleware
- ✅ Login/authentication pages
- ✅ Basic dashboard layout
- ✅ Running on port 3006

### Database Schema Implemented
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

   The project uses both `.env` (for Prisma) and `.env.local` (for Next.js). Both files are already configured with your Supabase credentials.

4. **Run database migrations** (when database credentials are correct):
```bash
npx prisma migrate dev
```

5. **Generate Prisma Client**:
```bash
npx prisma generate
```

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
│   ├── auth/                # Authentication pages
│   │   ├── login/           # Login page
│   │   ├── callback/        # OAuth callback
│   │   └── signout/         # Sign out route
│   ├── dashboard/           # Dashboard page
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/              # Reusable React components
├── lib/                     # Library code
│   ├── auth/               # Authentication utilities
│   │   ├── supabase-client.ts  # Client-side Supabase
│   │   └── supabase-server.ts  # Server-side Supabase
│   ├── db/                 # Database utilities
│   │   └── prisma.ts       # Prisma client instance
│   ├── api/                # API client utilities
│   ├── utils/              # Helper functions
│   └── validations/        # Zod schemas
├── prisma/                  # Prisma configuration
│   └── schema.prisma        # Database schema
├── types/                   # TypeScript type definitions
├── hooks/                   # Custom React hooks
├── middleware.ts            # Next.js middleware (auth protection)
├── .env                     # Environment variables (Prisma)
├── .env.local              # Environment variables (Next.js)
└── package.json            # Project dependencies
```

## 🔒 Authentication

The platform uses Supabase Authentication with support for:
- Email/password login
- Google OAuth (configured)
- Multi-factor authentication (MFA)
- Session management with automatic refresh

Protected routes are automatically secured via Next.js middleware.

## 🗄️ Database

### Schema Overview

**Core Entities:**
- `User` - User accounts with roles and status
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

# Optional Integrations
WINFLEX_API_KEY=
IPIPELINE_API_KEY=
RATEWATCH_API_KEY=
# ... (more integrations)
```

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

**Phase 5: Reporting & Analytics**
- Custom report builder
- Business intelligence
- Performance metrics

**Phase 6: Security & Testing**
- Security hardening
- Performance optimization
- Comprehensive testing

**Phase 7: Deployment**
- Production deployment
- Monitoring setup
- Documentation

## 🤝 Contributing

This is a private project for Valor Financial Specialists. Development is managed by BotMakers, Inc.

## 📄 License

UNLICENSED - Private and proprietary

## 🆘 Support

For issues or questions, contact the development team.

---

**Built with ❤️ by BotMakers, Inc.**

Last Updated: November 2025
