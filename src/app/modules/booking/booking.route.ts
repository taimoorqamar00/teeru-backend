import { Router } from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { bookingController } from './booking.controller';
import { bookingValidation } from './booking.validation';

const router = Router();

// Public routes (no auth required)
router.post(
  '/check-availability',
  validateRequest(bookingValidation.checkAvailabilityValidationSchema),
  bookingController.checkBayAvailability
);

// Protected routes (auth required)
router.post('/', (req, res, next) => {
  console.log('=== BOOKING ROUTE DEBUG ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Content-Length:', req.headers['content-length']);
  console.log('Raw body before auth:', req.body);
  console.log('Body type before auth:', typeof req.body);
  console.log('=============================');
  
  // Continue to next middleware
  next();
});

router.post(
  '/',
  auth('admin', 'user'),
  validateRequest(bookingValidation.createBookingValidationSchema),
  bookingController.createBooking
);

router.get(
  '/',
  auth('admin'),
  bookingController.getAllBookings
);

router.get(
  '/my',
  auth('user', 'admin'),
  bookingController.getMyBookings
);

router.get(
  '/today',
  auth('admin'),
  bookingController.getTodayBookings
);

router.get(
  '/upcoming',
  auth('admin'),
  bookingController.getUpcomingBookings
);

router.get(
  '/statistics',
  auth('admin'),
  bookingController.getBookingStatistics
);

router.get(
  '/date-range',
  auth('admin'),
  bookingController.getBookingsByDateRange
);

router.get(
  '/:id',
  auth('user', 'admin'),
  bookingController.getBookingById
);

router.patch(
  '/:id/extend',
  auth('admin'),
  validateRequest(bookingValidation.extendSessionValidationSchema),
  bookingController.extendSession
);

router.patch(
  '/:id/end',
  auth('admin'),
  bookingController.endSession
);

router.patch(
  '/:id',
  auth('admin', 'user'),
  validateRequest(bookingValidation.updateBookingValidationSchema),
  bookingController.updateBooking
);

router.delete(
  '/:id',
  auth('admin', 'user'),
  bookingController.deleteBooking
);

// Debug endpoint to troubleshoot request parsing
router.post('/debug', (req, res) => {
  console.log('=== BOOKING DEBUG ENDPOINT ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Body:', req.body);
  console.log('Body type:', typeof req.body);
  console.log('Body keys:', req.body ? Object.keys(req.body) : 'undefined');
  console.log('===============================');
  
  res.json({
    success: true,
    message: 'Debug endpoint',
    debug: {
      method: req.method,
      url: req.url,
      contentType: req.headers['content-type'],
      body: req.body,
      bodyType: typeof req.body,
      bodyKeys: req.body ? Object.keys(req.body) : null
    }
  });
});

export const bookingRoutes = router;
