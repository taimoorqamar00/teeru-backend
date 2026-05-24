import { Router } from 'express';
import { zoneTypeController } from './zoneType.controller';
import auth from '../../middleware/auth';

export const zoneTypeRoutes = Router();

zoneTypeRoutes
  .post(
    '/create',
    auth('admin'),
    zoneTypeController.createZoneType
  )

  .get(
    '/',
    zoneTypeController.getAllZoneTypes
  )

  .get(
    '/:id',
    zoneTypeController.getZoneTypeById
  )

  .patch(
    '/:id',
    auth('admin'),
    zoneTypeController.updateZoneType
  )

  .delete(
    '/:id',
    auth('admin'),
    zoneTypeController.deleteZoneType
  );
