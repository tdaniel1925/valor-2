/**
 * Zod validation schemas for authentication endpoints
 */

import { z } from 'zod';

/**
 * Sign in request schema
 */
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(255, 'Email is too long'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(255, 'Password is too long'),
});

export type SignInInput = z.infer<typeof signInSchema>;

/**
 * Sign up request schema
 */
export const signUpSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name is too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'First name contains invalid characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name is too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'Last name contains invalid characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(255, 'Email is too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(255, 'Password is too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  agencyName: z
    .string()
    .min(1, 'Agency name is required')
    .min(2, 'Agency name must be at least 2 characters')
    .max(100, 'Agency name is too long')
    .regex(/^[a-zA-Z0-9\s\-&.,]+$/, 'Agency name contains invalid characters'),
  subdomain: z
    .string()
    .min(1, 'Subdomain is required')
    .min(3, 'Subdomain must be at least 3 characters')
    .max(63, 'Subdomain is too long')
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Subdomain must contain only lowercase letters, numbers, and hyphens'),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(255, 'Email is too long'),
});

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;

/**
 * Password reset confirmation schema
 */
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(255, 'Password is too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
