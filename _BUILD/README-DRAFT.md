# Valor SaaS Platform - Multi-Tenant Insurance Intelligence

> Transform SmartOffice data into actionable insights with AI-powered analytics, custom reporting, and real-time sync.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## 🚀 What is Valor?

Valor is a **multi-tenant SaaS platform** designed for insurance agencies to:
- ✅ **Automatically sync** SmartOffice reports via email
- 🔍 **Search & filter** policies and agents in milliseconds
- 🤖 **Ask AI questions** like "Show me all policies over $200k"
- 📊 **Generate custom reports** without SQL knowledge
- 📈 **Track trends** with real-time analytics
- 🔐 **Isolate data** with enterprise-grade tenant security

Built for insurance agencies frustrated by SmartOffice's rigid interface.

---

## ✨ Key Features

### 🎯 SmartOffice Intelligence
- **Auto-Sync**: Reports emailed to your custom address (`your-agency@reports.valorfs.app`) automatically import
- **Universal Search**: Full-text search across policies, agents, carriers, and more
- **Smart Filters**: Carrier, advisor, date range, policy type, status
- **Export Anywhere**: Excel, CSV, PDF downloads

### 🤖 AI Chat Assistant
- Natural language queries: *"What's my total premium for Athene policies this quarter?"*
- SQL generation powered by Claude AI
- Safe, read-only queries with tenant isolation
- Visual results with charts and tables

### 📊 Custom Reports
- Drag-and-drop report builder
- Save and schedule reports (daily/weekly/monthly)
- Share with team members
- 50+ pre-built templates

### 🏢 Multi-Tenant Architecture
- Subdomain-based tenant isolation (`your-agency.valorfs.app`)
- Row-level security in database
- Each agency's data completely isolated
- Custom domain support (coming soon)

---

## 🏗️ Tech Stack

- **Frontend**: [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/)
- **Backend**: Next.js API Routes, [Prisma ORM](https://www.prisma.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Supabase) with Row Level Security
- **Auth**: [Supabase Auth](https://supabase.com/docs/guides/auth)
- **Storage**: Supabase Storage for report files
- **AI**: [Anthropic Claude](https://www.anthropic.com/) API
- **Automation**: [Zapier](https://zapier.com/) for email → storage pipeline
- **Testing**: [Playwright](https://playwright.dev/) (E2E), [Vitest](https://vitest.dev/) (unit)
- **Deployment**: [Vercel](https://vercel.com/) with Edge Functions

---

## 🚦 Quick Start

### Prerequisites
- Node.js 18.17+ and npm 9+
- Supabase account (free tier works)
- Anthropic API key

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/valor-saas.git
cd valor-saas

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Run database migrations
npx prisma migrate deploy
npx prisma generate

# 5. Start development server
npm run dev
```

Visit http://localhost:2050

**For complete setup instructions**, see [`_BUILD/STARTUP.md`](_BUILD/STARTUP.md)

---

## 📖 Documentation

- **[Project Specification](_BUILD/PROJECT-SPEC.md)** - Complete feature specs, architecture, and requirements
- **[Master Build Plan](_BUILD/MASTER.md)** - Feature dependency order and timeline
- **[Setup Guide](_BUILD/STARTUP.md)** - Step-by-step environment setup
- **[Build State](_BUILD/BUILD-STATE.md)** - Current development progress
- **[SmartOffice Intelligence Guide](SMARTOFFICE_INTELLIGENCE_SYSTEM.md)** - Detailed integration docs

---

## 🎯 Project Status

**Current Phase**: 🔨 Active Development

### Completed Features
✅ Database schema design
✅ SmartOffice data analysis
✅ Multi-tenant architecture spec
✅ AI chat service design

### In Progress
🔄 Multi-tenant foundation (database migrations)
🔄 Tenant onboarding flow

### Upcoming
⬜ SmartOffice ETL service
⬜ Dashboard UI
⬜ AI chat assistant
⬜ Custom report builder

See [BUILD-STATE.md](_BUILD/BUILD-STATE.md) for detailed progress.

---

## 🏃 Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server on port 2050
npm run build            # Build for production
npm run start            # Run production build
npm run clean            # Clean build artifacts

# Database
npm run db:migrate       # Run Prisma migrations
npm run db:seed          # Seed database with test data
npm run db:studio        # Open Prisma Studio (DB GUI)

# Testing
npm run test             # Run unit tests (Vitest)
npm run test:watch       # Unit tests in watch mode
npm run test:e2e         # Run E2E tests (Playwright)
npm run test:smoke       # Quick smoke tests
npm run test:ui          # Playwright UI mode

# Code Quality
npm run type-check       # TypeScript type checking
npm run lint             # ESLint
npm run format           # Prettier
```

### Project Structure

```
valor-saas/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── api/               # API routes
│   ├── dashboard/         # Main dashboard
│   ├── smartoffice/       # SmartOffice Intelligence pages
│   └── onboarding/        # New user onboarding
├── components/            # React components
│   ├── ui/               # Radix UI primitives
│   ├── smartoffice/      # SmartOffice-specific components
│   └── layout/           # Layout components
├── lib/                   # Business logic
│   ├── auth/             # Authentication & authorization
│   ├── smartoffice/      # SmartOffice ETL & services
│   ├── tenants/          # Multi-tenancy logic
│   └── analytics/        # Dashboard metrics
├── prisma/               # Database schema & migrations
├── tests/                # Test files
│   ├── e2e/             # Playwright tests
│   └── unit/            # Vitest tests
├── _BUILD/              # Build documentation & context
└── public/              # Static assets
```

---

## 🔐 Security

- **Tenant Isolation**: Row Level Security (RLS) enforces data separation at database level
- **Authentication**: Supabase Auth with secure session management
- **API Security**: Rate limiting, request validation, CORS properly configured
- **SQL Injection Prevention**: Parameterized queries only, no dynamic SQL
- **Webhook Validation**: HMAC signature verification on all incoming webhooks
- **Environment Secrets**: Never committed to git, loaded from secure env vars

**Reporting Security Issues**: Email security@valorfinancial.com

---

## 🧪 Testing

We maintain high test coverage for reliability:

- **E2E Tests** (Playwright): Multi-tenant isolation, user flows, data sync
- **Unit Tests** (Vitest): Business logic, utilities, components
- **Coverage Target**: 80%+ for critical paths

```bash
# Run all tests
npm run test:all

# Run specific test file
npm run test tests/unit/smartoffice/etl-service.test.ts

# E2E with UI
npm run test:ui
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Set up wildcard DNS: `*.valorfs.app` → Vercel
4. Deploy automatically on push to `main`

**Important**: Enable Edge Middleware in Vercel settings for tenant resolution.

### Self-Hosted

Requires:
- Node.js 18+ server
- PostgreSQL database
- Wildcard SSL certificate
- Reverse proxy (Nginx/Caddy) for subdomain routing

See [Deployment Guide](docs/DEPLOYMENT.md) for detailed instructions.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow PPBV process (Plan → Prompt → Build → Verify) per [`CLAUDE.md`](CLAUDE.md)
4. Write tests for new features
5. Ensure `npm run test:all` passes
6. Commit changes (`git commit -m 'Add amazing feature'`)
7. Push to branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

**Code Style**: We use Prettier + ESLint. Run `npm run format` before committing.

---

## 📝 License

Copyright © 2026 Valor Financial Specialists LLC

This project is [MIT](LICENSE) licensed.

---

## 📞 Support

- **Documentation**: [docs.valorfs.app](https://docs.valorfs.app)
- **Email**: support@valorfinancial.com
- **Issues**: [GitHub Issues](https://github.com/your-org/valor-saas/issues)
- **Community**: [Discord](https://discord.gg/valorfs) (coming soon)

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) by Vercel
- [Supabase](https://supabase.com/) for auth & database
- [Anthropic Claude](https://www.anthropic.com/) for AI
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [Prisma](https://www.prisma.io/) for type-safe database access

Special thanks to the insurance agents who provided feedback on SmartOffice pain points.

---

**Made with ❤️ for insurance professionals**

