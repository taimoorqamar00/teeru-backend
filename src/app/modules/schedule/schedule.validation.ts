import { z } from 'zod';

// Pricing validation
const pricingSchema = z.object({
  standardRate: z
    .number()
    .min(0, { message: 'Standard rate must be a positive number' }),
  premiumRate: z
    .number()
    .min(0, { message: 'Premium rate must be a positive number' })
    .optional(),
  weekendRate: z
    .number()
    .min(0, { message: 'Weekend rate must be a positive number' })
    .optional(),
});

// Create schedule validation
const createScheduleValidationSchema = z.object({
  body: z.object({
    bayId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid bay ID format' }),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
      .refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid date format',
      }),
    duration: z
      .number()
      .min(0.5, { message: 'Duration must be at least 0.5 hours' })
      .max(24, { message: 'Duration cannot exceed 24 hours' })
      .multipleOf(0.5, { message: 'Duration must be a multiple of 0.5' }),
    pricing: pricingSchema,
    // Accept either shape: timeSlot (new) or timeSlots array (legacy)
    timeSlot: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'timeSlot must be in HH:mm format' })
      .optional(),
    timeSlots: z
      .array(
        z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Each time slot must be in HH:mm format' }),
      )
      .min(1)
      .optional(),
    pricingRuleId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid pricing rule ID format' })
      .optional(),
    addOns: z
      .array(z.string().max(100, { message: 'Each add-on must be less than 100 characters' }))
      .max(50, { message: 'Maximum 50 add-ons allowed' })
      .optional()
      .default([]),
  }).refine(
    (data) => data.timeSlot || (data.timeSlots && data.timeSlots.length > 0),
    { message: 'timeSlot or timeSlots is required', path: ['timeSlot'] },
  ),
});

// Update schedule validation
const updateScheduleValidationSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid schedule ID format' }),
  }),
  body: z.object({
    bayId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid bay ID format' })
      .optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
      .refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid date format',
      })
      .optional(),
    timeSlot: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'timeSlot must be in HH:mm format' })
      .optional(),
    timeSlots: z
      .array(
        z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Each time slot must be in HH:mm format' }),
      )
      .min(1)
      .optional(),
    duration: z
      .number()
      .min(0.5, { message: 'Duration must be at least 0.5 hours' })
      .max(24, { message: 'Duration cannot exceed 24 hours' })
      .multipleOf(0.5, { message: 'Duration must be a multiple of 0.5' })
      .optional(),
    pricing: pricingSchema.optional(),
    pricingRuleId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid pricing rule ID format' })
      .optional(),
    addOns: z
      .array(z.string().max(100, { message: 'Each add-on must be less than 100 characters' }))
      .max(50, { message: 'Maximum 50 add-ons allowed' })
      .optional(),
  }),
});

// Get schedule by ID validation
const getScheduleByIdValidationSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid schedule ID format' }),
  }),
});

// List schedules query validation
const listSchedulesQueryValidationSchema = z.object({
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
      .enum(['date', 'duration', 'createdAt', 'bayId'])
      .optional(),
    sortOrder: z
      .enum(['asc', 'desc'])
      .optional(),
    bayId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid bay ID format' })
      .optional(),
    dateFrom: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'DateFrom must be in YYYY-MM-DD format' })
      .refine((date) => !date || !isNaN(Date.parse(date)), {
        message: 'Invalid dateFrom format',
      })
      .optional(),
    dateTo: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'DateTo must be in YYYY-MM-DD format' })
      .refine((date) => !date || !isNaN(Date.parse(date)), {
        message: 'Invalid dateTo format',
      })
      .optional(),
    search: z
      .string()
      .max(100, { message: 'Search term must be less than 100 characters' })
      .optional(),
  }),
});

export const scheduleValidation = {
  createScheduleValidationSchema,
  updateScheduleValidationSchema,
  getScheduleByIdValidationSchema,
  listSchedulesQueryValidationSchema,
};
