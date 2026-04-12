/**
 * Zod validation schemas for quote endpoints
 */

import { z } from 'zod';

/**
 * Quote type enum
 */
export const quoteTypeSchema = z.enum([
  'TERM_LIFE',
  'WHOLE_LIFE',
  'UNIVERSAL_LIFE',
  'VARIABLE_LIFE',
  'ANNUITY',
  'LONG_TERM_CARE',
  'DISABILITY',
  'CRITICAL_ILLNESS',
]);

/**
 * Quote status enum
 */
export const quoteStatusSchema = z.enum([
  'DRAFT',
  'PENDING',
  'APPROVED',
  'DECLINED',
  'EXPIRED',
]);

/**
 * Gender enum
 */
export const genderSchema = z.enum(['MALE', 'FEMALE', 'OTHER']);

/**
 * Smoker status enum
 */
export const smokerStatusSchema = z.enum(['NON_SMOKER', 'SMOKER', 'OCCASIONAL']);

/**
 * Health class enum
 */
export const healthClassSchema = z.enum([
  'PREFERRED_PLUS',
  'PREFERRED',
  'STANDARD_PLUS',
  'STANDARD',
  'SUBSTANDARD',
]);

/**
 * Life insurance quote request schema
 */
export const createLifeQuoteSchema = z.object({
  // Client information
  clientName: z
    .string()
    .min(1, 'Client name is required')
    .max(100, 'Client name is too long')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Invalid characters in client name'),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)')
    .refine((date) => {
      const dob = new Date(date);
      const now = new Date();
      const age = now.getFullYear() - dob.getFullYear();
      return age >= 18 && age <= 85;
    }, 'Age must be between 18 and 85')
    .or(z.date()),
  gender: genderSchema,
  smokerStatus: smokerStatusSchema,
  healthClass: healthClassSchema.optional(),

  // Coverage details
  coverageAmount: z
    .number()
    .min(25000, 'Minimum coverage is $25,000')
    .max(10000000, 'Maximum coverage is $10,000,000')
    .refine((amount) => amount % 1000 === 0, 'Coverage must be in $1,000 increments')
    .or(z.string().regex(/^\d+$/, 'Invalid coverage amount').transform(Number)),
  term: z
    .number()
    .min(5, 'Minimum term is 5 years')
    .max(40, 'Maximum term is 40 years')
    .refine((term) => [5, 10, 15, 20, 25, 30, 35, 40].includes(term), 'Term must be 5, 10, 15, 20, 25, 30, 35, or 40 years')
    .optional(),

  // Product type
  type: quoteTypeSchema,

  // Optional fields
  state: z
    .string()
    .length(2, 'State must be 2-letter code')
    .regex(/^[A-Z]{2}$/, 'State must be uppercase 2-letter code')
    .optional(),
  zip: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format')
    .optional(),
  riders: z
    .array(
      z.enum([
        'WAIVER_OF_PREMIUM',
        'ACCELERATED_DEATH_BENEFIT',
        'CHILD_RIDER',
        'DISABILITY_INCOME',
        'ACCIDENTAL_DEATH',
        'CRITICAL_ILLNESS',
        'LONG_TERM_CARE',
        'RETURN_OF_PREMIUM',
      ])
    )
    .max(10, 'Maximum 10 riders allowed')
    .optional(),
  notes: z
    .string()
    .max(1000, 'Notes cannot exceed 1,000 characters')
    .optional(),
});

export type CreateLifeQuoteInput = z.infer<typeof createLifeQuoteSchema>;

/**
 * Term life quote request schema
 */
export const createTermQuoteSchema = createLifeQuoteSchema.extend({
  type: z.literal('TERM_LIFE'),
  term: z
    .number()
    .min(5, 'Minimum term is 5 years')
    .max(40, 'Maximum term is 40 years')
    .refine((term) => [5, 10, 15, 20, 25, 30, 35, 40].includes(term), 'Term must be 5, 10, 15, 20, 25, 30, 35, or 40 years'),
});

export type CreateTermQuoteInput = z.infer<typeof createTermQuoteSchema>;

/**
 * Long-term care quote request schema
 */
export const createLTCQuoteSchema = z.object({
  clientName: z
    .string()
    .min(1, 'Client name is required')
    .max(100, 'Client name is too long')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Invalid characters in client name'),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)')
    .refine((date) => {
      const dob = new Date(date);
      const now = new Date();
      const age = now.getFullYear() - dob.getFullYear();
      return age >= 40 && age <= 79;
    }, 'Age must be between 40 and 79 for LTC')
    .or(z.date()),
  gender: genderSchema,

  // LTC-specific fields
  dailyBenefit: z
    .number()
    .min(50, 'Minimum daily benefit is $50')
    .max(500, 'Maximum daily benefit is $500')
    .or(z.string().regex(/^\d+$/, 'Invalid daily benefit').transform(Number)),
  benefitPeriod: z
    .number()
    .refine((period) => [2, 3, 4, 5, 6].includes(period), 'Benefit period must be 2, 3, 4, 5, or 6 years'),
  eliminationPeriod: z
    .number()
    .refine((period) => [0, 30, 60, 90, 180].includes(period), 'Elimination period must be 0, 30, 60, 90, or 180 days'),
  inflationProtection: z
    .enum(['NONE', 'SIMPLE', 'COMPOUND'])
    .optional(),

  type: z.literal('LONG_TERM_CARE'),
  state: z
    .string()
    .length(2, 'State must be 2-letter code')
    .regex(/^[A-Z]{2}$/, 'State must be uppercase 2-letter code')
    .optional(),
  notes: z
    .string()
    .max(1000, 'Notes cannot exceed 1,000 characters')
    .optional(),
});

export type CreateLTCQuoteInput = z.infer<typeof createLTCQuoteSchema>;

/**
 * Quote update schema
 */
export const updateQuoteSchema = z.object({
  status: quoteStatusSchema.optional(),
  premium: z
    .number()
    .min(0, 'Premium must be positive')
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid premium format').transform(Number))
    .optional(),
  notes: z
    .string()
    .max(1000, 'Notes cannot exceed 1,000 characters')
    .optional(),
  expirationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)')
    .or(z.date())
    .optional(),
});

export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;

/**
 * PDF generation schema
 */
export const generateQuotePDFSchema = z.object({
  clientName: z.string().min(1, 'Client name is required').max(100),
  quotes: z
    .array(
      z.object({
        carrierName: z.string().min(1).max(100),
        productName: z.string().min(1).max(100),
        monthlyPremium: z.number().min(0),
        annualPremium: z.number().min(0),
        faceAmount: z.number().min(0),
        term: z.number().optional(),
        features: z.object({
          convertible: z.boolean().optional(),
          renewable: z.boolean().optional(),
          livingBenefits: z.boolean().optional(),
        }).optional(),
      })
    )
    .min(1, 'At least one quote is required')
    .max(20, 'Maximum 20 quotes per PDF'),
  agentName: z.string().max(100).optional(),
  agentPhone: z.string().max(20).optional(),
  agentEmail: z.string().email().max(255).optional(),
});

export type GenerateQuotePDFInput = z.infer<typeof generateQuotePDFSchema>;
