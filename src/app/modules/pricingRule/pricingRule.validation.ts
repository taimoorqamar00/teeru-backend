import { z } from 'zod';

const DAY_ENUM = z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);
const TIME_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

const createPricingRuleValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, { message: 'Rule name is required' })
      .max(100, { message: 'Rule name must be less than 100 characters' }),
    days: z
      .array(DAY_ENUM)
      .min(1, { message: 'At least one day must be selected' }),
    startTime: z
      .string()
      .regex(TIME_REGEX, { message: 'startTime must be in HH:mm format' }),
    endTime: z
      .string()
      .regex(TIME_REGEX, { message: 'endTime must be in HH:mm format' }),
    pricePerHour: z
      .coerce.number()
      .min(0, { message: 'Price per hour must be a positive number' }),
    isActive: z.boolean().optional().default(true),
  }).refine(
    (data) => data.startTime < data.endTime,
    { message: 'endTime must be after startTime', path: ['endTime'] },
  ),
});

const updatePricingRuleValidationSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid pricing rule ID format' }),
  }),
  body: z.object({
    name: z
      .string()
      .min(1)
      .max(100)
      .optional(),
    days: z
      .array(DAY_ENUM)
      .min(1, { message: 'At least one day must be selected' })
      .optional(),
    startTime: z
      .string()
      .regex(TIME_REGEX, { message: 'startTime must be in HH:mm format' })
      .optional(),
    endTime: z
      .string()
      .regex(TIME_REGEX, { message: 'endTime must be in HH:mm format' })
      .optional(),
    pricePerHour: z
      .coerce.number()
      .min(0)
      .optional(),
    isActive: z.boolean().optional(),
  }),
});

const getPricingRuleByIdValidationSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid pricing rule ID format' }),
  }),
});

const listPricingRulesQueryValidationSchema = z.object({
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
    sortBy: z.enum(['name', 'pricePerHour', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    search: z.string().max(100).optional(),
    isActive: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
  }),
});

export const pricingRuleValidation = {
  createPricingRuleValidationSchema,
  updatePricingRuleValidationSchema,
  getPricingRuleByIdValidationSchema,
  listPricingRulesQueryValidationSchema,
};