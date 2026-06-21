import { Router } from 'express';
import { addonController } from './addon.controller';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { addonValidation } from './addon.validation';

export const addonRoutes = Router();

addonRoutes
  .post(
    '/create',
    auth('admin'),
    validateRequest(addonValidation.createAddonValidationSchema),
    addonController.createAddon
  )

  .get(
    '/',
    addonController.getAllAddons
  )

  .get(
    '/:id',
    validateRequest(addonValidation.getAddonByIdValidationSchema),
    addonController.getAddonById
  )

  .patch(
    '/:id',
    auth('admin'),
    validateRequest(addonValidation.updateAddonValidationSchema),
    addonController.updateAddon
  )

  .delete(
    '/:id',
    auth('admin'),
    addonController.deleteAddon
  );
