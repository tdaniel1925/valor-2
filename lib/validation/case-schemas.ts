/**
 * Zod validation schemas for case management endpoints
 */

import { z } from 'zod';

/**
 * Case status enum
 */
export const caseStatusSchema = z.enum([
  'LEAD',
  'CONTACTED',
  'QUOTED',
  'SUBMITTED',
  'UNDERWRITING',
  'APPROVED',
  'ISSUED',
  'DECLINED',
  'CANCELLED',
  'LAPSED',
]);

/**
 * Case priority enum
 */
export const casePrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

/**
 * Case note type enum
 */
export const noteTypeSchema = z.enum([
  'GENERAL',
  'PHONE_CALL',
  'EMAIL',
  'MEETING',
  'UNDERWRITING',
  'FOLLOWUP',
  'DOCUMENT',
]);

/**
 * Create case schema
 */
export const createCaseSchema = z.object({
  clientName: z
    .string()
    .min(1, 'Client name is required')
    .max(100, 'Client name is too long')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Invalid characters in client name'),
  clientEmail: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email is too long')
    .optional(),
  clientPhone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone format')
    .max(20, 'Phone number is too long')
    .optional(),
  type: z.enum([
    'TERM_LIFE',
    'WHOLE_LIFE',
    'UNIVERSAL_LIFE',
    'VARIABLE_LIFE',
    'ANNUITY',
    'LONG_TERM_CARE',
    'DISABILITY',
    'CRITICAL_ILLNESS',
  ]),
  status: caseStatusSchema.default('LEAD'),
  priority: casePrioritySchema.default('MEDIUM'),
  faceAmount: z
    .number()
    .min(0, 'Face amount must be positive')
    .max(100000000, 'Face amount is too large')
    .optional(),
  premium: z
    .number()
    .min(0, 'Premium must be positive')
    .max(1000000, 'Premium is too large')
    .optional(),
  carrier: z.string().max(100, 'Carrier name is too long').optional(),
  policyNumber: z.string().max(50, 'Policy number is too long').optional(),
  notes: z.string().max(5000, 'Notes cannot exceed 5,000 characters').optional(),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;

/**
 * Update case schema
 */
export const updateCaseSchema = z.object({
  clientName: z
    .string()
    .min(1, 'Client name is required')
    .max(100, 'Client name is too long')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Invalid characters in client name')
    .optional(),
  clientEmail: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email is too long')
    .optional(),
  clientPhone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone format')
    .max(20, 'Phone number is too long')
    .optional(),
  status: caseStatusSchema.optional(),
  priority: casePrioritySchema.optional(),
  faceAmount: z
    .number()
    .min(0, 'Face amount must be positive')
    .max(100000000, 'Face amount is too large')
    .optional(),
  premium: z
    .number()
    .min(0, 'Premium must be positive')
    .max(1000000, 'Premium is too large')
    .optional(),
  carrier: z.string().max(100, 'Carrier name is too long').optional(),
  policyNumber: z.string().max(50, 'Policy number is too long').optional(),
  assignedToId: z.string().uuid('Invalid user ID').optional(),
  notes: z.string().max(5000, 'Notes cannot exceed 5,000 characters').optional(),
});

export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;

/**
 * Case status transition schema
 */
export const transitionCaseSchema = z.object({
  newStatus: caseStatusSchema,
  reason: z
    .string()
    .min(1, 'Reason is required')
    .max(500, 'Reason cannot exceed 500 characters'),
  notifyClient: z.boolean().default(false),
});

export type TransitionCaseInput = z.infer<typeof transitionCaseSchema>;

/**
 * Add case note schema
 */
export const addCaseNoteSchema = z.object({
  type: noteTypeSchema.default('GENERAL'),
  content: z
    .string()
    .min(1, 'Note content is required')
    .max(5000, 'Note cannot exceed 5,000 characters'),
  isPrivate: z.boolean().default(false),
  reminderDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/, 'Invalid date format')
    .or(z.date())
    .optional(),
});

export type AddCaseNoteInput = z.infer<typeof addCaseNoteSchema>;

/**
 * Update case note schema
 */
export const updateCaseNoteSchema = z.object({
  content: z
    .string()
    .min(1, 'Note content is required')
    .max(5000, 'Note cannot exceed 5,000 characters')
    .optional(),
  isPrivate: z.boolean().optional(),
  reminderDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/, 'Invalid date format')
    .or(z.date())
    .nullable()
    .optional(),
});

export type UpdateCaseNoteInput = z.infer<typeof updateCaseNoteSchema>;

/**
 * Case query parameters schema
 */
export const casesQuerySchema = z.object({
  status: z.string().optional(),
  priority: casePrioritySchema.optional(),
  assignedTo: z.string().uuid('Invalid user ID').optional(),
  search: z.string().max(100, 'Search query is too long').optional(),
  page: z
    .string()
    .optional()
    .default('1')
    .pipe(
      z.string()
        .regex(/^\d+$/, 'Page must be a positive number')
        .transform(Number)
        .refine((n) => n >= 1, 'Page must be at least 1')
    ),
  limit: z
    .string()
    .optional()
    .default('20')
    .pipe(
      z.string()
        .regex(/^\d+$/, 'Limit must be a positive number')
        .transform(Number)
        .refine((n) => n >= 1 && n <= 100, 'Limit must be between 1 and 100')
    ),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'clientName', 'status', 'priority'])
    .default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CasesQueryInput = z.infer<typeof casesQuerySchema>;

/**
 * Bulk case operation schema
 */
export const bulkCaseOperationSchema = z.object({
  action: z.enum(['updateStatus', 'updatePriority', 'assignTo', 'delete']),
  caseIds: z
    .array(z.string().uuid('Invalid case ID'))
    .min(1, 'At least one case ID is required')
    .max(100, 'Maximum 100 cases per bulk operation'),
  data: z
    .object({
      status: caseStatusSchema.optional(),
      priority: casePrioritySchema.optional(),
      assignedToId: z.string().uuid('Invalid user ID').optional(),
    })
    .optional(),
});

export type BulkCaseOperationInput = z.infer<typeof bulkCaseOperationSchema>;
