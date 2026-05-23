import { z } from 'zod';

const permissionEnum = z.enum([
  'view_bookings',
  'manage_checkins',
  'manage_bays',
  'view_finance',
]);

const userValidationSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .min(1, { message: 'Full name is required' })
      .optional(),
    email: z.string().email({ message: 'Invalid email format' }),
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters long' }),
    phone: z
      .string()
      .optional(),
    about: z.string().optional(),
    profileImage: z.string().optional(),
    coverImage: z.string().optional(),
  }),
});

const createStaffValidationSchema = z.object({
  body: z.object({
    fullName: z.string().min(1, { message: 'Full name is required' }),
    gender: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email({ message: 'Invalid email format' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
    role: z.enum(['admin', 'staff']).optional(),
    permissions: z.array(permissionEnum).optional(),
  }),
});

const updateStaffValidationSchema = z.object({
  body: z.object({
    role: z.enum(['admin', 'staff']).optional(),
    permissions: z.array(permissionEnum).optional(),
  }).refine(data => data.role !== undefined || data.permissions !== undefined, {
    message: 'At least one of role or permissions must be provided',
  }),
});

const updatePermissionsValidationSchema = z.object({
  body: z.object({
    permissions: z.array(permissionEnum).min(0, { message: 'Permissions must be an array' }),
  }),
});

export const userValidation = {
  userValidationSchema,
  createStaffValidationSchema,
  updateStaffValidationSchema,
  updatePermissionsValidationSchema,
};
