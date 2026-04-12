/**
 * Zod validation schemas for commission endpoints
 */

import { z } from 'zod';

/**
 * Commission type enum
 */
export const commissionTypeSchema = z.enum([
  'FIRST_YEAR',
  'RENEWAL',
  'BONUS',
  'OVERRIDE',
  'TRAIL',
]);

/**
 * Commission status enum
 */
export const commissionStatusSchema = z.enum([
  'PENDING',
  'PAID',
  'CANCELLED',
]);

/**
 * Create commission schema
 */
export const createCommissionSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  caseId: z.string().uuid('Invalid case ID'),
  carrier: z
    .string()
    .min(1, 'Carrier is required')
    .max(100, 'Carrier name is too long'),
  policyNumber: z
    .string()
    .min(1, 'Policy number is required')
    .max(50, 'Policy number is too long'),
  grossPremium: z
    .number()
    .min(0, 'Gross premium must be positive')
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid gross premium format')),
  commissionRate: z
    .number()
    .min(0, 'Commission rate must be positive')
    .max(100, 'Commission rate cannot exceed 100%')
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid commission rate format')),
  type: commissionTypeSchema,
  periodStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format (use YYYY-MM-DD)')
    .or(z.date()),
  periodEnd: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format (use YYYY-MM-DD)')
    .or(z.date()),
});

export type CreateCommissionInput = z.infer<typeof createCommissionSchema>;

/**
 * Mark commissions as paid schema
 */
export const markPaidSchema = z.object({
  commissionIds: z
    .array(z.string().uuid('Invalid commission ID'))
    .min(1, 'At least one commission ID is required')
    .max(100, 'Cannot process more than 100 commissions at once'),
  paidDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format (use YYYY-MM-DD)')
    .or(z.date())
    .optional(),
});

export type MarkPaidInput = z.infer<typeof markPaidSchema>;

/**
 * Commission calculation schema
 */
export const calculateCommissionSchema = z.object({
  grossPremium: z.number().min(0, 'Gross premium must be positive'),
  commissionRate: z.number().min(0).max(100, 'Commission rate must be 0-100%'),
  splits: z
    .array(
      z.object({
        userId: z.string().uuid(),
        splitPercentage: z.number().min(0).max(100),
      })
    )
    .optional(),
});

export type CalculateCommissionInput = z.infer<typeof calculateCommissionSchema>;
