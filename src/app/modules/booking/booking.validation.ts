import { z } from 'zod';

// Customer info validation
const customerInfoSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Customer name is required' })
    .max(100, { message: 'Name must be less than 100 characters' }),
  phone: z
    .string()
    .min(1, { message: 'Phone number is required' })
    .regex(/^[+]?[\d\s\-\(\)]+$/, { message: 'Invalid phone number format' }),
  email: z
    .string()
    .email({ message: 'Invalid email format' })
    .optional()
    .or(z.literal('')),
});

// Create booking validation
const createBookingValidationSchema = z.object({
  body: z.object({
    customerInfo: customerInfoSchema,
    customerType: z
      .enum(['member', 'walk-in', 'pass', 'mobile'], {
        errorMap: () => ({ message: 'Customer type must be member, walk-in, pass, or mobile' }),
      }),
    bayNumber: z
      .number()
      .int()
      .min(1, { message: 'Bay number must be a positive integer' }),
    duration: z
      .number()
      .int()
      .min(1, { message: 'Duration must be 1, 2, or 3 hours' })
      .max(3, { message: 'Duration must be 1, 2, or 3 hours' }),
    totalAmount: z
      .number()
      .min(0, { message: 'Total amount must be positive' }),
    paymentMethod: z
      .enum(['wave', 'orange-money', 'paydunya', 'membership'], {
        errorMap: () => ({ message: 'Payment method must be wave, orange-money, paydunya, or membership' }),
      }),
    bookingDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid booking date format' })
      .transform((date) => new Date(date))
      .optional(),
    startTime: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Start time must be in HH:mm format (24-hour)' })
      .optional(),
    scheduleId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid schedule ID format' })
      .optional(),
    status: z
      .enum(['pending', 'confirmed', 'cancelled', 'completed'])
      .optional()
      .default('pending'),
    notes: z
      .string()
      .max(500, { message: 'Notes must be less than 500 characters' })
      .optional(),
  }).refine(
    (data) => data.scheduleId || (data.bookingDate && data.startTime),
    { message: 'Provide scheduleId or both bookingDate and startTime', path: ['scheduleId'] },
  ),
});

// Update booking validation
const updateBookingValidationSchema = z.object({
  body: z.object({
    customerInfo: customerInfoSchema.optional(),
    customerType: z
      .enum(['member', 'walk-in', 'pass', 'mobile'])
      .optional(),
    bayNumber: z
      .number()
      .int()
      .min(1)
      .optional(),
    duration: z
      .number()
      .int()
      .min(1)
      .max(3)
      .optional(),
    totalAmount: z
      .number()
      .min(0)
      .optional(),
    paymentMethod: z
      .enum(['wave', 'orange-money', 'paydunya', 'membership'])
      .optional(),
    bookingDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid booking date format',
      })
      .transform((date) => new Date(date))
      .optional(),
    startTime: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'Start time must be in HH:mm format (24-hour)',
      })
      .optional(),
    status: z
      .enum(['pending', 'confirmed', 'cancelled', 'completed'])
      .optional(),
    notes: z
      .string()
      .max(500)
      .optional(),
  }),
});

// Get booking by ID validation
const getBookingByIdValidationSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid booking ID format' }),
  }),
});

// List bookings query validation
const listBookingsQueryValidationSchema = z.object({
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
      .enum(['bookingDate', 'startTime', 'customerInfo.name', 'totalAmount', 'status', 'createdAt'])
      .optional(),
    sortOrder: z
      .enum(['asc', 'desc'])
      .optional(),
    status: z
      .enum(['pending', 'confirmed', 'cancelled', 'completed'])
      .optional(),
    customerType: z
      .enum(['member', 'walk-in', 'pass', 'mobile'])
      .optional(),
    bayNumber: z
      .string()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine((val) => val === undefined || val >= 1, {
        message: 'Bay number must be a positive integer',
      })
      .optional(),
    dateFrom: z
      .string()
      .refine((date) => !date || !isNaN(Date.parse(date)), {
        message: 'Invalid dateFrom format',
      })
      .transform((date) => (date ? new Date(date) : undefined))
      .optional(),
    dateTo: z
      .string()
      .refine((date) => !date || !isNaN(Date.parse(date)), {
        message: 'Invalid dateTo format',
      })
      .transform((date) => (date ? new Date(date) : undefined))
      .optional(),
    search: z
      .string()
      .max(100, { message: 'Search term must be less than 100 characters' })
      .optional(),
  }),
});

// Check availability validation
const checkAvailabilityValidationSchema = z.object({
  query: z.object({
    bayNumber: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine((val) => val >= 1, {
        message: 'Bay number must be a positive integer',
      }),
    date: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid date format',
      })
      .transform((date) => new Date(date)),
  }),
});

const extendSessionValidationSchema = z.object({
  body: z
    .object({
      duration: z
        .number()
        .min(0, { message: 'Duration cannot be negative' })
        .multipleOf(0.5, { message: 'Duration must be a multiple of 0.5 hours' })
        .optional()
        .default(0),
      addOns: z
        .array(z.string().min(1))
        .optional()
        .default([]),
    })
    .refine((data) => data.duration > 0 || (data.addOns && data.addOns.length > 0), {
      message: 'Provide a duration extension, at least one add-on, or both',
    }),
});

export const bookingValidation = {
  createBookingValidationSchema,
  updateBookingValidationSchema,
  getBookingByIdValidationSchema,
  listBookingsQueryValidationSchema,
  checkAvailabilityValidationSchema,
  extendSessionValidationSchema,
};
