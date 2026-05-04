import { Router } from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { membershipController } from './membership.controller';
import { membershipValidation } from './membership.validation';

const router = Router();

router.get('/stats', auth('admin'), membershipController.getStats);

// Membership plans — specific paths before /:id
router.get('/plans', auth('admin'), membershipController.getAllPlans);
router.post(
  '/plans',
  auth('admin'),
  validateRequest(membershipValidation.createPlanSchema),
  membershipController.createPlan,
);
router.patch(
  '/plans/:id/toggle',
  auth('admin'),
  membershipController.togglePlan,
);
router.patch(
  '/plans/:id',
  auth('admin'),
  validateRequest(membershipValidation.updatePlanSchema),
  membershipController.updatePlan,
);

// Short-term plans
router.get('/short-term-plans', auth('admin'), membershipController.getAllShortTermPlans);
router.post(
  '/short-term-plans',
  auth('admin'),
  validateRequest(membershipValidation.createShortTermPlanSchema),
  membershipController.createShortTermPlan,
);
router.patch(
  '/short-term-plans/:id',
  auth('admin'),
  validateRequest(membershipValidation.updateShortTermPlanSchema),
  membershipController.updateShortTermPlan,
);

// Subscriptions — specific paths before /:id
router.get('/members', auth('admin'), membershipController.getMembers);
router.post(
  '/assign',
  auth('admin'),
  validateRequest(membershipValidation.assignMembershipSchema),
  membershipController.assignMembership,
);
router.post(
  '/assign-plan',
  auth('admin'),
  validateRequest(membershipValidation.assignShortTermPlanSchema),
  membershipController.assignShortTermPlan,
);
router.patch('/members/:id/renew', auth('admin'), membershipController.renewSubscription);

export const membershipRoutes = router;
