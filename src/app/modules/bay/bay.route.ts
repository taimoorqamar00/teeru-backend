import { Router } from 'express';
import auth from '../../middleware/auth';
import checkPermission from '../../middleware/checkPermission';
import validateRequest from '../../middleware/validateRequest';
import { bayController } from './bay.controller';
import { bayValidation } from './bay.validation';

const router = Router();

// Public routes (no auth required for viewing)
router.get(
  '/list',
  bayController.getBaysList
);

router.get(
  '/my-bays',
  auth('user', 'admin'),
  bayController.getMyBays
);

router.get(
  '/details/:id',
  bayController.getBayDetails
);

router.post(
  '/book',
  auth('user', 'admin'),
  bayController.bookBay
);

// Check if a slot is already booked (public)
router.get(
  '/check-slot/:slotId',
  bayController.checkSlotAvailability
);

router.get(
  '/',
  bayController.getAllBays
);

router.get(
  '/live',
  bayController.getLiveBays
);

router.get(
  '/schedule',
  validateRequest(bayValidation.getBayScheduleValidationSchema),
  bayController.getBaySchedule
);

// Protected routes (auth required for management operations)
router.post(
  '/',
  auth('admin'),
  checkPermission('manage_bays'),
  validateRequest(bayValidation.createBayValidationSchema),
  bayController.createBay
);

router.get(
  '/active',
  auth('admin'),
  checkPermission('manage_bays'),
  bayController.getActiveBays
);


router.get(
  '/statistics',
  auth('admin'),
  checkPermission('manage_bays'),
  bayController.getBayStatistics
);

router.get(
  '/:id',
  auth('admin'),
  checkPermission('manage_bays'),
  validateRequest(bayValidation.getBayByIdValidationSchema),
  bayController.getBayById
);

router.patch(
  '/:id',
  auth('admin'),
  checkPermission('manage_bays'),
  validateRequest(bayValidation.updateBayValidationSchema),
  bayController.updateBay
);

router.delete(
  '/:id',
  auth('admin'),
  checkPermission('manage_bays'),
  validateRequest(bayValidation.getBayByIdValidationSchema),
  bayController.deleteBay
);

export const bayRoutes = router;
