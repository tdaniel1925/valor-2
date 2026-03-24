import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Stripe from 'stripe';

// Mock the Stripe module
vi.mock('stripe');

describe('Stripe Server Utilities', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Set up test environment variables
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
    process.env.STRIPE_STARTER_PRICE_ID = 'price_starter_test';
    process.env.STRIPE_PROFESSIONAL_PRICE_ID = 'price_professional_test';
    process.env.STRIPE_ENTERPRISE_PRICE_ID = 'price_enterprise_test';

    // Clear module cache to get fresh imports
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('SUBSCRIPTION_PLANS', () => {
    it('should have correct plan structure for starter plan', async () => {
      const { SUBSCRIPTION_PLANS } = await import('@/lib/stripe/stripe-server');

      expect(SUBSCRIPTION_PLANS.starter).toEqual({
        name: 'Starter',
        price: 9900,
        priceId: 'price_starter_test',
        maxUsers: 5,
        maxStorageGB: 10,
        features: [
          '5 users',
          '10GB storage',
          'Basic reporting',
          'Email support',
        ],
      });
    });

    it('should have correct plan structure for professional plan', async () => {
      const { SUBSCRIPTION_PLANS } = await import('@/lib/stripe/stripe-server');

      expect(SUBSCRIPTION_PLANS.professional).toEqual({
        name: 'Professional',
        price: 29900,
        priceId: 'price_professional_test',
        maxUsers: 25,
        maxStorageGB: 50,
        features: [
          '25 users',
          '50GB storage',
          'Advanced reporting',
          'SmartOffice Intelligence',
          'Priority email support',
          'Phone support',
        ],
      });
    });

    it('should have correct plan structure for enterprise plan', async () => {
      const { SUBSCRIPTION_PLANS } = await import('@/lib/stripe/stripe-server');

      expect(SUBSCRIPTION_PLANS.enterprise).toEqual({
        name: 'Enterprise',
        price: 99900,
        priceId: 'price_enterprise_test',
        maxUsers: 9999,
        maxStorageGB: 500,
        features: [
          'Unlimited users',
          '500GB storage',
          'Enterprise reporting',
          'White label branding',
          'SmartOffice Intelligence',
          '24/7 priority support',
          'Dedicated account manager',
          'Custom integrations',
        ],
      });
    });

    it('should have all three plan types', async () => {
      const { SUBSCRIPTION_PLANS } = await import('@/lib/stripe/stripe-server');

      expect(Object.keys(SUBSCRIPTION_PLANS)).toEqual(['starter', 'professional', 'enterprise']);
    });

    it('should have prices in cents', async () => {
      const { SUBSCRIPTION_PLANS } = await import('@/lib/stripe/stripe-server');

      expect(SUBSCRIPTION_PLANS.starter.price).toBe(9900); // $99.00
      expect(SUBSCRIPTION_PLANS.professional.price).toBe(29900); // $299.00
      expect(SUBSCRIPTION_PLANS.enterprise.price).toBe(99900); // $999.00
    });
  });

  describe('isStripeConfigured()', () => {
    it('should return true when Stripe is configured', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_real_key';
      vi.resetModules();

      const { isStripeConfigured } = await import('@/lib/stripe/stripe-server');

      expect(isStripeConfigured()).toBe(true);
    });

    it('should return false when Stripe key is missing', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      vi.resetModules();

      const { isStripeConfigured } = await import('@/lib/stripe/stripe-server');

      expect(isStripeConfigured()).toBe(false);
    });

    it('should return false when Stripe key is the placeholder', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder_for_build';
      vi.resetModules();

      const { isStripeConfigured } = await import('@/lib/stripe/stripe-server');

      expect(isStripeConfigured()).toBe(false);
    });

    it('should return false when Stripe key is empty string', async () => {
      process.env.STRIPE_SECRET_KEY = '';
      vi.resetModules();

      const { isStripeConfigured } = await import('@/lib/stripe/stripe-server');

      expect(isStripeConfigured()).toBe(false);
    });
  });

  describe('createCheckoutSession()', () => {
    it('should create a checkout session with correct parameters', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      });

      // Mock Stripe constructor and methods
      const MockStripe = vi.fn().mockImplementation(() => ({
        checkout: {
          sessions: {
            create: mockCreate,
          },
        },
      }));

      vi.mocked(Stripe).mockImplementation(MockStripe as any);
      vi.resetModules();

      const { createCheckoutSession } = await import('@/lib/stripe/stripe-server');

      const result = await createCheckoutSession({
        plan: 'starter',
        tenantEmail: 'test@example.com',
        tenantName: 'Test Tenant',
        tenantSlug: 'test-tenant',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: 'price_starter_test',
            quantity: 1,
          },
        ],
        customer_email: 'test@example.com',
        metadata: {
          tenantName: 'Test Tenant',
          tenantSlug: 'test-tenant',
          tenantEmail: 'test@example.com',
          plan: 'starter',
        },
        subscription_data: {
          metadata: {
            tenantName: 'Test Tenant',
            tenantSlug: 'test-tenant',
            plan: 'starter',
          },
          trial_period_days: 14,
        },
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
      });

      expect(result).toEqual({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      });
    });

    it('should work with professional plan', async () => {
      const mockCreate = vi.fn().mockResolvedValue({ id: 'cs_test_456' });

      const MockStripe = vi.fn().mockImplementation(() => ({
        checkout: {
          sessions: {
            create: mockCreate,
          },
        },
      }));

      vi.mocked(Stripe).mockImplementation(MockStripe as any);
      vi.resetModules();

      const { createCheckoutSession } = await import('@/lib/stripe/stripe-server');

      await createCheckoutSession({
        plan: 'professional',
        tenantEmail: 'pro@example.com',
        tenantName: 'Pro Tenant',
        tenantSlug: 'pro-tenant',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            {
              price: 'price_professional_test',
              quantity: 1,
            },
          ],
        })
      );
    });
  });

  describe('createCustomerPortalSession()', () => {
    it('should create a customer portal session', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        id: 'bps_test_123',
        url: 'https://billing.stripe.com/test',
      });

      const MockStripe = vi.fn().mockImplementation(() => ({
        billingPortal: {
          sessions: {
            create: mockCreate,
          },
        },
      }));

      vi.mocked(Stripe).mockImplementation(MockStripe as any);
      vi.resetModules();

      const { createCustomerPortalSession } = await import('@/lib/stripe/stripe-server');

      const result = await createCustomerPortalSession({
        customerId: 'cus_test_123',
        returnUrl: 'https://example.com/billing',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        customer: 'cus_test_123',
        return_url: 'https://example.com/billing',
      });

      expect(result).toEqual({
        id: 'bps_test_123',
        url: 'https://billing.stripe.com/test',
      });
    });
  });

  describe('getSubscription()', () => {
    it('should retrieve a subscription by ID', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        status: 'active',
        current_period_end: 1234567890,
      };

      const mockRetrieve = vi.fn().mockResolvedValue(mockSubscription);

      const MockStripe = vi.fn().mockImplementation(() => ({
        subscriptions: {
          retrieve: mockRetrieve,
        },
      }));

      vi.mocked(Stripe).mockImplementation(MockStripe as any);
      vi.resetModules();

      const { getSubscription } = await import('@/lib/stripe/stripe-server');

      const result = await getSubscription('sub_test_123');

      expect(mockRetrieve).toHaveBeenCalledWith('sub_test_123');
      expect(result).toEqual(mockSubscription);
    });
  });

  describe('cancelSubscription()', () => {
    it('should cancel subscription at period end', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        cancel_at_period_end: true,
      };

      const mockUpdate = vi.fn().mockResolvedValue(mockSubscription);

      const MockStripe = vi.fn().mockImplementation(() => ({
        subscriptions: {
          update: mockUpdate,
        },
      }));

      vi.mocked(Stripe).mockImplementation(MockStripe as any);
      vi.resetModules();

      const { cancelSubscription } = await import('@/lib/stripe/stripe-server');

      const result = await cancelSubscription('sub_test_123');

      expect(mockUpdate).toHaveBeenCalledWith('sub_test_123', {
        cancel_at_period_end: true,
      });
      expect(result.cancel_at_period_end).toBe(true);
    });
  });

  describe('reactivateSubscription()', () => {
    it('should reactivate a subscription', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        cancel_at_period_end: false,
      };

      const mockUpdate = vi.fn().mockResolvedValue(mockSubscription);

      const MockStripe = vi.fn().mockImplementation(() => ({
        subscriptions: {
          update: mockUpdate,
        },
      }));

      vi.mocked(Stripe).mockImplementation(MockStripe as any);
      vi.resetModules();

      const { reactivateSubscription } = await import('@/lib/stripe/stripe-server');

      const result = await reactivateSubscription('sub_test_123');

      expect(mockUpdate).toHaveBeenCalledWith('sub_test_123', {
        cancel_at_period_end: false,
      });
      expect(result.cancel_at_period_end).toBe(false);
    });
  });
});
