/**
 * Mock Stripe for Testing
 *
 * Provides mock implementations of Stripe API for unit tests.
 */

import { vi } from 'vitest';

export interface MockStripeCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface MockStripeSubscription {
  id: string;
  customer: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  current_period_end: number;
  current_period_start: number;
  cancel_at_period_end: boolean;
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        product: string;
      };
    }>;
  };
  metadata?: Record<string, string>;
}

export interface MockStripeCheckoutSession {
  id: string;
  url: string;
  customer?: string;
  subscription?: string;
  payment_status: 'paid' | 'unpaid';
  status: 'complete' | 'expired' | 'open';
}

export interface MockStripePrice {
  id: string;
  product: string;
  unit_amount: number;
  currency: string;
  recurring?: {
    interval: 'month' | 'year';
  };
}

export interface MockStripeProduct {
  id: string;
  name: string;
  description?: string;
  metadata?: Record<string, string>;
}

/**
 * Creates a mock Stripe customer
 */
export function createMockCustomer(overrides?: Partial<MockStripeCustomer>): MockStripeCustomer {
  return {
    id: 'cus_test_123',
    email: 'test@example.com',
    name: 'Test Customer',
    metadata: {},
    ...overrides,
  };
}

/**
 * Creates a mock Stripe subscription
 */
export function createMockSubscription(
  overrides?: Partial<MockStripeSubscription>
): MockStripeSubscription {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: 'sub_test_123',
    customer: 'cus_test_123',
    status: 'active',
    current_period_start: now,
    current_period_end: now + 2592000, // 30 days
    cancel_at_period_end: false,
    items: {
      data: [
        {
          id: 'si_test_123',
          price: {
            id: 'price_test_123',
            product: 'prod_test_123',
          },
        },
      ],
    },
    metadata: {},
    ...overrides,
  };
}

/**
 * Creates a mock Stripe checkout session
 */
export function createMockCheckoutSession(
  overrides?: Partial<MockStripeCheckoutSession>
): MockStripeCheckoutSession {
  return {
    id: 'cs_test_123',
    url: 'https://checkout.stripe.com/test',
    payment_status: 'paid',
    status: 'complete',
    ...overrides,
  };
}

/**
 * Creates a mock Stripe price
 */
export function createMockPrice(overrides?: Partial<MockStripePrice>): MockStripePrice {
  return {
    id: 'price_test_123',
    product: 'prod_test_123',
    unit_amount: 9900, // $99.00
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
    ...overrides,
  };
}

/**
 * Creates a mock Stripe product
 */
export function createMockProduct(overrides?: Partial<MockStripeProduct>): MockStripeProduct {
  return {
    id: 'prod_test_123',
    name: 'Test Product',
    description: 'Test product description',
    metadata: {},
    ...overrides,
  };
}

/**
 * Creates a complete mock Stripe client
 */
export function createMockStripeClient() {
  return {
    customers: {
      create: vi.fn().mockResolvedValue(createMockCustomer()),
      retrieve: vi.fn().mockResolvedValue(createMockCustomer()),
      update: vi.fn().mockResolvedValue(createMockCustomer()),
      del: vi.fn().mockResolvedValue({ id: 'cus_test_123', deleted: true }),
      list: vi.fn().mockResolvedValue({
        data: [createMockCustomer()],
        has_more: false,
      }),
    },
    subscriptions: {
      create: vi.fn().mockResolvedValue(createMockSubscription()),
      retrieve: vi.fn().mockResolvedValue(createMockSubscription()),
      update: vi.fn().mockResolvedValue(createMockSubscription()),
      cancel: vi.fn().mockResolvedValue(createMockSubscription({ status: 'canceled' })),
      list: vi.fn().mockResolvedValue({
        data: [createMockSubscription()],
        has_more: false,
      }),
    },
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue(createMockCheckoutSession()),
        retrieve: vi.fn().mockResolvedValue(createMockCheckoutSession()),
        expire: vi.fn().mockResolvedValue(createMockCheckoutSession({ status: 'expired' })),
        list: vi.fn().mockResolvedValue({
          data: [createMockCheckoutSession()],
          has_more: false,
        }),
      },
    },
    billingPortal: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          id: 'bps_test_123',
          url: 'https://billing.stripe.com/test',
        }),
      },
    },
    prices: {
      create: vi.fn().mockResolvedValue(createMockPrice()),
      retrieve: vi.fn().mockResolvedValue(createMockPrice()),
      update: vi.fn().mockResolvedValue(createMockPrice()),
      list: vi.fn().mockResolvedValue({
        data: [createMockPrice()],
        has_more: false,
      }),
    },
    products: {
      create: vi.fn().mockResolvedValue(createMockProduct()),
      retrieve: vi.fn().mockResolvedValue(createMockProduct()),
      update: vi.fn().mockResolvedValue(createMockProduct()),
      del: vi.fn().mockResolvedValue({ id: 'prod_test_123', deleted: true }),
      list: vi.fn().mockResolvedValue({
        data: [createMockProduct()],
        has_more: false,
      }),
    },
    webhooks: {
      constructEvent: vi.fn((payload, sig, secret) => ({
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: {
          object: createMockCheckoutSession(),
        },
      })),
    },
  };
}

/**
 * Mock Stripe constructor
 */
export const MockStripe = vi.fn(() => createMockStripeClient());
