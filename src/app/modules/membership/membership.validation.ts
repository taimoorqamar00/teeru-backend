import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

const customerInfoSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().min(1, 'Phone is required'),
  customerId: objectIdSchema.optional(),
});

const createPlanSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    price: z.number().min(0, 'Price must be non-negative'),
    hoursPerMonth: z.number().min(0, 'Hours must be non-negative'),
    features: z.array(z.string()).optional().default([]),
  }),
});

const updatePlanSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).max(100).optional(),
      price: z.number().min(0).optional(),
      hoursPerMonth: z.number().min(0).optional(),
      features: z.array(z.string()).optional(),
    })
    .refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' }),
});

const createShortTermPlanSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    price: z.number().min(0),
    durationDays: z.number().int().min(1, 'Duration must be at least 1 day'),
    hoursIncluded: z.number().min(0),
  }),
});

const updateShortTermPlanSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).max(100).optional(),
      price: z.number().min(0).optional(),
      durationDays: z.number().int().min(1).optional(),
      hoursIncluded: z.number().min(0).optional(),
    })
    .refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' }),
});

const assignMembershipSchema = z.object({
  body: z.object({
    customerInfo: customerInfoSchema,
    planId: objectIdSchema,
    startDate: dateSchema,
    expiryDate: dateSchema,
    paymentMethod: z.enum(['wave', 'orange-money', 'paydunya']),
  }),
});

const assignShortTermPlanSchema = z.object({
  body: z.object({
    customerInfo: customerInfoSchema,
    planId: objectIdSchema,
    startDate: dateSchema,
    paymentMethod: z.enum(['wave', 'orange-money', 'paydunya']),
  }),
});

const purchaseMembershipSchema = z.object({
  body: z.object({
    planId: objectIdSchema,
    planType: z.enum(['membership', 'short-term']),
    paymentMethod: z.enum(['wave', 'orange-money', 'paydunya']),
  }),
});

export const membershipValidation = {
  createPlanSchema,
  updatePlanSchema,
  createShortTermPlanSchema,
  updateShortTermPlanSchema,
  assignMembershipSchema,
  assignShortTermPlanSchema,
  purchaseMembershipSchema,
};
