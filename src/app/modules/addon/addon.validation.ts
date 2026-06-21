import { z } from 'zod';

const createAddonValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, { message: 'Addon name is required' })
      .max(100, { message: 'Addon name must be less than 100 characters' }),
    price: z
      .coerce.number()
      .min(0, { message: 'Price must be a positive number' }),
    status: z.enum(['active', 'inactive']).optional().default('active'),
  }),
});

const updateAddonValidationSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid addon ID format' }),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    price: z.coerce.number().min(0).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

const getAddonByIdValidationSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid addon ID format' }),
  }),
});

export const addonValidation = {
  createAddonValidationSchema,
  updateAddonValidationSchema,
  getAddonByIdValidationSchema,
};
