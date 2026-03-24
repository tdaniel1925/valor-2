# Testing Quick Start Guide

## Overview

The Valor Insurance Platform now has comprehensive testing infrastructure set up and ready to use.

## Quick Commands

### Run All Tests
```bash
# Unit tests (watch mode)
npm run test:unit

# Unit tests (run once)
npm run test:unit:run

# Unit tests with coverage
npm run test:unit:coverage

# Unit tests with UI
npm run test:unit:ui

# E2E tests
npm test

# E2E smoke tests
npm run test:smoke
```

## Write Your First Test

### 1. Component Test

Create a file: `tests/unit/components/MyComponent.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### 2. API Test with Mocks

Create a file: `tests/unit/lib/api.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createMockSupabaseClient } from '@/tests/utils';

describe('API Function', () => {
  it('fetches data successfully', async () => {
    const mockSupabase = createMockSupabaseClient();

    // Your test here
    expect(mockSupabase).toBeDefined();
  });
});
```

### 3. Run Your Tests

```bash
npm run test:unit
```

## Import Test Utilities

All test utilities are available from a single import:

```typescript
import {
  // Supabase mocks
  createMockSupabaseClient,
  createMockUser,
  createMockSession,

  // Stripe mocks
  createMockStripeClient,
  createMockCustomer,
  createMockSubscription,

  // Database mocks
  createMockPrismaClient,
  testDataFactories,

  // Auth helpers
  createMockAuthContext,
  createMockCookies,
  simulateLogin,

  // General helpers
  renderWithProviders,
  createMockRouter,
  random,
  waitFor,
} from '@/tests/utils';
```

## Common Testing Patterns

### Testing a Component

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyButton } from '@/components/MyButton';

describe('MyButton', () => {
  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<MyButton onClick={handleClick}>Click me</MyButton>);

    await userEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Testing with Supabase

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createMockSupabaseClient, createMockResponse } from '@/tests/utils';

describe('Tenant API', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  it('fetches tenant', async () => {
    const mockTenant = { id: '123', name: 'Test' };
    mockSupabase.from().select().eq().single.mockResolvedValue(
      createMockResponse(mockTenant)
    );

    // Your API call here
    expect(mockSupabase.from).toHaveBeenCalledWith('tenants');
  });
});
```

### Testing with Authentication

```typescript
import { describe, it, expect } from 'vitest';
import { createMockAuthContext, TestUserRole } from '@/tests/utils';

describe('Protected Route', () => {
  it('allows admin access', () => {
    const authContext = createMockAuthContext({
      role: TestUserRole.ADMIN,
    });

    expect(authContext.user?.user_metadata.role).toBe(TestUserRole.ADMIN);
  });
});
```

## View Coverage Report

```bash
# Generate coverage
npm run test:unit:coverage

# Open coverage report in browser
# The report is generated at: coverage/index.html
```

## Troubleshooting

### Tests fail with module not found
- Make sure you're using the `@/` alias in imports
- Example: `import { Component } from '@/components/Component'`

### Mock not working
- Ensure mock is created before the import that uses it
- Use `vi.mock()` at the top of your test file

### Need help?
- Check `tests/TEST-INFRASTRUCTURE.md` for detailed documentation
- Look at example tests in `tests/unit/components/` and `tests/unit/lib/`

## File Structure

```
tests/
├── utils/                    # Test utilities (import from here)
│   ├── index.ts             # Central export
│   ├── mock-supabase.ts     # Supabase mocks
│   ├── mock-stripe.ts       # Stripe mocks
│   ├── test-database.ts     # Database helpers
│   ├── test-auth.ts         # Auth helpers
│   └── test-helpers.ts      # General helpers
├── unit/                    # Unit tests
│   ├── components/          # Component tests
│   └── lib/                 # Library/utility tests
└── e2e/                     # E2E tests (Playwright)
```

## Next Steps

1. Review `tests/TEST-INFRASTRUCTURE.md` for complete documentation
2. Look at example tests in `tests/unit/`
3. Start writing tests for your components and APIs
4. Run tests regularly during development
5. Aim for 80%+ code coverage

## Resources

- Vitest: https://vitest.dev
- React Testing Library: https://testing-library.com/react
- Playwright: https://playwright.dev
- Testing Best Practices: See `tests/TEST-INFRASTRUCTURE.md`
