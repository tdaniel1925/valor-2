# Valor Insurance Platform - Test Infrastructure

This document describes the comprehensive testing infrastructure for the Valor Insurance Platform.

## Overview

The testing infrastructure consists of:

1. **Unit Tests** (Vitest + React Testing Library)
2. **E2E Tests** (Playwright)
3. **Test Utilities** (Mocks, Helpers, Factories)

## Directory Structure

```
tests/
├── setup.ts                          # Global test setup (current)
├── test-setup-enhanced.ts            # Enhanced global test setup (recommended)
├── e2e/                              # End-to-end tests (Playwright)
│   ├── smoke.spec.ts
│   ├── auth-and-navigation.spec.ts
│   ├── stripe-billing.spec.ts
│   ├── tenant-isolation.spec.ts
│   └── integrations/
│       ├── ipipeline-api.spec.ts
│       └── ipipeline-integration.spec.ts
├── unit/                             # Unit tests (Vitest)
│   └── lib/
│       ├── auth/
│       │   └── tenant-context.test.ts
│       └── stripe/
│           └── stripe-server.test.ts
└── utils/                            # Test utilities
    ├── index.ts                      # Central export
    ├── mock-supabase.ts              # Supabase mocks
    ├── mock-stripe.ts                # Stripe mocks
    ├── test-database.ts              # Database helpers
    ├── test-auth.ts                  # Auth helpers
    └── test-helpers.ts               # General helpers
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run unit tests in watch mode
npm run test:unit

# Run unit tests with UI
npm run test:unit:ui

# Run unit tests once (CI mode)
npm run test:unit:run

# Run with coverage
npm run test:unit:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm test

# Run E2E tests with UI
npm run test:ui

# Run E2E tests in headed mode
npm run test:headed

# Run smoke tests only
npm run test:smoke

# Run specific test suite
npm run test:auth
npm run test:ipipeline

# Debug tests
npm run test:debug

# View test report
npm run test:report
```

## Test Utilities

### Mock Supabase Client

```typescript
import { createMockSupabaseClient, createMockUser, createMockSession } from '@/tests/utils';

// Create a mock Supabase client
const supabase = createMockSupabaseClient();

// Create a mock user
const user = createMockUser({ email: 'test@example.com' });

// Create a mock session
const session = createMockSession(user);

// Mock successful response
const response = createMockResponse({ id: '123', name: 'Test' });

// Mock error response
const error = createMockError('Not found', '404');
```

### Mock Stripe

```typescript
import { createMockStripeClient, createMockCustomer, createMockSubscription } from '@/tests/utils';

// Create a mock Stripe client
const stripe = createMockStripeClient();

// Create mock data
const customer = createMockCustomer({ email: 'test@example.com' });
const subscription = createMockSubscription({ status: 'active' });
const checkoutSession = createMockCheckoutSession();
```

### Mock Database (Prisma)

```typescript
import { createMockPrismaClient, testDataFactories } from '@/tests/utils';

// Create a mock Prisma client
const prisma = createMockPrismaClient();

// Use test data factories
const tenant = testDataFactories.tenant({ name: 'Custom Tenant' });
const user = testDataFactories.user({ email: 'custom@example.com' });
const case = testDataFactories.case({ status: 'APPROVED' });
```

### Authentication Helpers

```typescript
import {
  createMockAuthContext,
  createMockCookies,
  createMockHeaders,
  simulateLogin,
  TestUserRole
} from '@/tests/utils';

// Create authenticated context
const authContext = createMockAuthContext({
  userId: 'user-123',
  email: 'admin@example.com',
  role: TestUserRole.ADMIN,
  tenantId: 'tenant-123',
});

// Create mock cookies
const cookies = createMockCookies();
cookies.set('session', 'mock-session-token');

// Create mock headers
const headers = createMockHeaders({
  'x-tenant-id': 'tenant-123',
  'authorization': 'Bearer token',
});

// Simulate login
const { user, session } = await simulateLogin('test@example.com', 'password');
```

### General Test Helpers

```typescript
import {
  waitFor,
  wait,
  renderWithProviders,
  createMockRouter,
  createMockFile,
  random
} from '@/tests/utils';

// Wait for condition
await waitFor(() => element.isVisible(), { timeout: 5000 });

// Wait for specific time
await wait(1000);

// Render with React Query provider
const { getByText } = renderWithProviders(<MyComponent />);

// Mock Next.js router
const router = createMockRouter({ pathname: '/dashboard' });

// Create mock file for upload testing
const file = createMockFile('test.pdf', 'content', 'application/pdf');

// Generate random test data
const email = random.email();
const name = random.string(10);
const amount = random.number(100, 1000);
```

## Configuration Files

### vitest.config.ts

Configures Vitest for unit testing:
- React plugin for JSX support
- jsdom environment for DOM testing
- Coverage with v8 provider
- Path aliases (@/ -> root)

### playwright.config.ts

Configures Playwright for E2E testing:
- Multiple browsers (Chromium, Firefox, WebKit)
- Mobile viewports
- Screenshots/videos on failure
- Automatic dev server startup

### tests/setup.ts

Global test setup:
- Mocks Next.js modules (headers, cookies, navigation)
- Sets environment variables
- Configures jsdom environment

### tests/test-setup-enhanced.ts

Enhanced global test setup (recommended to replace setup.ts):
- All features from setup.ts
- Browser API mocks (IntersectionObserver, ResizeObserver)
- localStorage/sessionStorage mocks
- Automatic cleanup after each test

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);

    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('user can log in successfully', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome')).toBeVisible();
  });
});
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Use `afterEach` to clean up state between tests
3. **Descriptive Names**: Use clear, descriptive test names
4. **Arrange-Act-Assert**: Structure tests with clear setup, action, and verification
5. **Mock External Dependencies**: Always mock external APIs and services
6. **Test User Behavior**: Focus on testing what users do, not implementation details
7. **Accessibility**: Test with screen reader-friendly queries (getByRole, getByLabelText)

## Coverage Goals

- **Statements**: >80%
- **Branches**: >80%
- **Functions**: >80%
- **Lines**: >80%

## Troubleshooting

### Tests fail with "Cannot find module"

Make sure path aliases are configured in vitest.config.ts:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './'),
  },
}
```

### Tests timeout

Increase timeout in test or config:

```typescript
// In test
test('slow test', async () => {
  // ...
}, { timeout: 10000 });

// In config
export default defineConfig({
  test: {
    testTimeout: 10000,
  },
});
```

### Mock not working

Make sure mock is defined before import:

```typescript
vi.mock('@/lib/stripe', () => ({
  stripe: createMockStripeClient(),
}));

// Then import
import { stripe } from '@/lib/stripe';
```

## Next Steps

To use the enhanced test setup:

1. Update vitest.config.ts to use test-setup-enhanced.ts:
   ```typescript
   setupFiles: ['./tests/test-setup-enhanced.ts']
   ```

2. Add test scripts to package.json (already added)

3. Start writing tests using the utilities in tests/utils/

4. Run tests regularly during development

5. Add tests to CI/CD pipeline
