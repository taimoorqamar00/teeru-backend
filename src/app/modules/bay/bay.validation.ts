import { z } from 'zod';

// Create bay validation
const createBayValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, { message: 'Bay name is required' })
      .max(100, { message: 'Bay name must be less than 100 characters' }),
    number: z
      .number()
      .int()
      .min(1, { message: 'Bay number must be a positive integer' }),
    hardware: z
      .string()
      .min(1, { message: 'Hardware is required' })
      .max(200, { message: 'Hardware must be less than 200 characters' }),
    projector: z
      .string()
      .min(1, { message: 'Projector is required' })
      .max(200, { message: 'Projector must be less than 200 characters' }),
    isActive: z
      .boolean()
      .default(true),
  }),
});

// Update bay validation
const updateBayValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, { message: 'Bay name is required' })
      .max(100, { message: 'Bay name must be less than 100 characters' })
      .optional(),
    number: z
      .number()
      .int()
      .min(1, { message: 'Bay number must be a positive integer' })
      .optional(),
    hardware: z
      .string()
      .min(1, { message: 'Hardware is required' })
      .max(200, { message: 'Hardware must be less than 200 characters' })
      .optional(),
    projector: z
      .string()
      .min(1, { message: 'Projector is required' })
      .max(200, { message: 'Projector must be less than 200 characters' })
      .optional(),
    isActive: z
      .boolean()
      .optional(),
  }),
});

// Get bay by ID validation
const getBayByIdValidationSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid bay ID format' }),
  }),
});

// List bays query validation
const listBaysQueryValidationSchema = z.object({
  query: z.object({
    page: z
      .string()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val > 0, { message: 'Page must be positive' })
      .optional(),
    limit: z
      .string()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .refine((val) => val > 0 && val <= 100, { message: 'Limit must be between 1 and 100' })
      .optional(),
    sortBy: z
      .enum(['name', 'number', 'hardware', 'projector', 'isActive', 'createdAt'])
      .optional(),
    sortOrder: z
      .enum(['asc', 'desc'])
      .optional(),
    isActive: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    search: z
      .string()
      .max(100, { message: 'Search term must be less than 100 characters' })
      .optional(),
  }),
});

// Get bay schedule validation
const getBayScheduleValidationSchema = z.object({
  query: z.object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
      .refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid date format',
      }),
  }),
});

export const bayValidation = {
  createBayValidationSchema,
  updateBayValidationSchema,
  getBayByIdValidationSchema,
  listBaysQueryValidationSchema,
  getBayScheduleValidationSchema,
};
