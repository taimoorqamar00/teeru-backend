import { Router } from 'express';
import auth from '../../middleware/auth';
import checkPermission from '../../middleware/checkPermission';
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
router.post(
  '/',
  auth('admin', 'user'),
  validateRequest(bookingValidation.createBookingValidationSchema),
  bookingController.createBooking
);

router.get(
  '/',
  auth('admin'),
  checkPermission('view_bookings'),
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
  checkPermission('view_bookings'),
  bookingController.getTodayBookings
);

router.get(
  '/upcoming',
  auth('admin'),
  checkPermission('view_bookings'),
  bookingController.getUpcomingBookings
);

router.get(
  '/statistics',
  auth('admin'),
  checkPermission('view_bookings'),
  bookingController.getBookingStatistics
);

router.get(
  '/live-sessions',
  auth('admin'),
  checkPermission('view_bookings', 'manage_checkins'),
  bookingController.getLiveSessions
);

router.get(
  '/date-range',
  auth('admin'),
  checkPermission('view_bookings'),
  bookingController.getBookingsByDateRange
);

router.get(
  '/:id',
  auth('user', 'admin'),
  bookingController.getBookingById
);

router.patch(
  '/:id/start',
  auth('admin'),
  checkPermission('manage_checkins'),
  bookingController.startSession
);

router.patch(
  '/:id/extend',
  auth('admin'),
  checkPermission('manage_checkins'),
  validateRequest(bookingValidation.extendSessionValidationSchema),
  bookingController.extendSession
);

router.patch(
  '/:id/end',
  auth('admin'),
  checkPermission('manage_checkins'),
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

export const bookingRoutes = router;
