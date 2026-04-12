/**
 * Zod validation schemas for admin endpoints
 */

import { z } from 'zod';

/**
 * User roles enum
 */
export const userRoleSchema = z.enum(['ADMINISTRATOR', 'EXECUTIVE', 'MANAGER', 'AGENT']);

/**
 * User status enum
 */
export const userStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']);

/**
 * Create user schema
 */
export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(255, 'Email is too long'),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'First name contains invalid characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'Last name contains invalid characters'),
  role: userRoleSchema,
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional(),
  organizationId: z.string().uuid('Invalid organization ID').optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Update user schema
 */
export const updateUserSchema = z.object({
  firstName: z
    .string()
    .max(50, 'First name is too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'First name contains invalid characters')
    .optional(),
  lastName: z
    .string()
    .max(50, 'Last name is too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'Last name contains invalid characters')
    .optional(),
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
    .nullable(),
  organizationId: z.string().uuid('Invalid organization ID').optional().nullable(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * Bulk user operations schema
 */
export const bulkUserOperationSchema = z.object({
  action: z.enum(['updateRole', 'updateStatus', 'delete', 'assignOrganization']),
  userIds: z
    .array(z.string().uuid('Invalid user ID'))
    .min(1, 'At least one user ID is required')
    .max(100, 'Cannot operate on more than 100 users at once'),
  data: z
    .object({
      role: userRoleSchema.optional(),
      status: userStatusSchema.optional(),
      organizationId: z.string().uuid('Invalid organization ID').optional(),
    })
    .optional(),
});

export type BulkUserOperationInput = z.infer<typeof bulkUserOperationSchema>;

/**
 * Organization type enum
 */
export const organizationTypeSchema = z.enum([
  'AGENCY',
  'TEAM',
  'BRANCH',
  'REGION',
  'DIVISION',
]);

/**
 * Organization status enum
 */
export const organizationStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);

/**
 * Create organization schema
 */
export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, 'Organization name is required')
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name is too long')
    .regex(/^[a-zA-Z0-9\s\-&.,]+$/, 'Organization name contains invalid characters'),
  type: organizationTypeSchema,
  parentId: z.string().uuid('Invalid parent organization ID').optional().nullable(),
  description: z.string().max(500, 'Description is too long').optional().nullable(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

/**
 * Update organization schema
 */
export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name is too long')
    .regex(/^[a-zA-Z0-9\s\-&.,]+$/, 'Organization name contains invalid characters')
    .optional(),
  type: organizationTypeSchema.optional(),
  status: organizationStatusSchema.optional(),
  parentId: z.string().uuid('Invalid parent organization ID').optional().nullable(),
  description: z.string().max(500, 'Description is too long').optional().nullable(),
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
