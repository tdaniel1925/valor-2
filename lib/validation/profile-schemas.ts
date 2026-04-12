/**
 * Zod validation schemas for profile endpoints
 */

import { z } from 'zod';

/**
 * Update profile schema
 */
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Invalid characters in first name')
    .optional(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Invalid characters in last name')
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone format')
    .max(20, 'Phone number is too long')
    .nullable()
    .optional(),
  profile: z
    .object({
      bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
      title: z.string().max(100, 'Title is too long').optional(),
      department: z.string().max(100, 'Department is too long').optional(),
      location: z.string().max(100, 'Location is too long').optional(),
      timezone: z.string().max(50, 'Timezone is too long').optional(),
      photoUrl: z
        .string()
        .url('Invalid URL format')
        .max(500, 'Photo URL is too long')
        .optional(),
      linkedinUrl: z
        .string()
        .url('Invalid URL format')
        .max(500, 'LinkedIn URL is too long')
        .optional(),
      twitterUrl: z
        .string()
        .url('Invalid URL format')
        .max(500, 'Twitter URL is too long')
        .optional(),
    })
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Update profile photo schema
 */
export const updatePhotoSchema = z.object({
  photoUrl: z
    .string()
    .url('Invalid URL format')
    .max(500, 'Photo URL is too long'),
});

export type UpdatePhotoInput = z.infer<typeof updatePhotoSchema>;

/**
 * Update notification preferences schema
 */
export const updateNotificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  monthlyReport: z.boolean().optional(),
  caseUpdates: z.boolean().optional(),
  commissionAlerts: z.boolean().optional(),
  teamActivity: z.boolean().optional(),
});

export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required')
    .max(255, 'Password is too long'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(255, 'Password is too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  confirmPassword: z
    .string()
    .min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
