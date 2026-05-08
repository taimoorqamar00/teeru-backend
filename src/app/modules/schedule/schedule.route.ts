import { Router } from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { scheduleController } from './schedule.controller';
import { scheduleValidation } from './schedule.validation';

const router = Router();

// Public routes (no auth required for viewing)
router.get(
  '/',
  scheduleController.getAllSchedules
);

router.get(
  '/check-conflict',
  scheduleController.checkScheduleConflict
);

router.get(
  '/available-slots',
  scheduleController.getAvailableSlots
);

// Protected routes (auth required for management operations)
router.post(
  '/',
  auth('admin'),
  validateRequest(scheduleValidation.createScheduleValidationSchema),
  scheduleController.createSchedule
);

router.get(
  '/date-range',
  auth('admin'),
  scheduleController.getSchedulesByDateRange
);

router.get(
  '/bay/:bayId',
  auth('admin'),
  validateRequest(scheduleValidation.getScheduleByIdValidationSchema),
  scheduleController.getSchedulesByBay
);

router.delete(
  '/bay/:bayId',
  auth('admin'),
  scheduleController.deleteSchedulesByBay
);

router.get(
  '/statistics',
  auth('admin'),
  scheduleController.getScheduleStatistics
);

router.get(
  '/:id',
  auth('admin'),
  validateRequest(scheduleValidation.getScheduleByIdValidationSchema),
  scheduleController.getScheduleById
);

router.patch(
  '/:id',
  auth('admin'),
  validateRequest(scheduleValidation.updateScheduleValidationSchema),
  scheduleController.updateSchedule
);

router.delete(
  '/:id',
  auth('admin'),
  validateRequest(scheduleValidation.getScheduleByIdValidationSchema),
  scheduleController.deleteSchedule
);

export const scheduleRoutes = router;
