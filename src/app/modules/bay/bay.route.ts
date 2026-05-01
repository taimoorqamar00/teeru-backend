import { Router } from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { bayController } from './bay.controller';
import { bayValidation } from './bay.validation';

const router = Router();

// Public routes (no auth required for viewing)
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
  validateRequest(bayValidation.createBayValidationSchema),
  bayController.createBay
);

router.get(
  '/active',
  auth('admin'),
  bayController.getActiveBays
);


router.get(
  '/statistics',
  auth('admin'),
  bayController.getBayStatistics
);

router.get(
  '/:id',
  auth('admin'),
  validateRequest(bayValidation.getBayByIdValidationSchema),
  bayController.getBayById
);

router.patch(
  '/:id',
  auth('admin'),
  validateRequest(bayValidation.updateBayValidationSchema),
  bayController.updateBay
);

router.delete(
  '/:id',
  auth('admin'),
  validateRequest(bayValidation.getBayByIdValidationSchema),
  bayController.deleteBay
);

export const bayRoutes = router;
