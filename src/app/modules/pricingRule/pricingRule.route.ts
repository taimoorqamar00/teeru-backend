import { Router } from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { pricingRuleController } from './pricingRule.controller';
import { pricingRuleValidation } from './pricingRule.validation';

const router = Router();

// Public — frontend needs this list to populate the schedule-create dropdown
router.get('/', pricingRuleController.getAllPricingRules);

// Admin CRUD
router.post(
  '/',
  auth('admin'),
  validateRequest(pricingRuleValidation.createPricingRuleValidationSchema),
  pricingRuleController.createPricingRule,
);

router.get(
  '/:id',
  auth('admin'),
  validateRequest(pricingRuleValidation.getPricingRuleByIdValidationSchema),
  pricingRuleController.getPricingRuleById,
);

router.patch(
  '/:id',
  auth('admin'),
  validateRequest(pricingRuleValidation.updatePricingRuleValidationSchema),
  pricingRuleController.updatePricingRule,
);

router.delete(
  '/:id',
  auth('admin'),
  validateRequest(pricingRuleValidation.getPricingRuleByIdValidationSchema),
  pricingRuleController.deletePricingRule,
);

export const pricingRuleRoutes = router;
