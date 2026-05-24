import { Request, Response } from 'express';
import { zoneTypeService } from './zoneType.service';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';

const createZoneType = catchAsync(async (req: Request, res: Response) => {
  const result = await zoneTypeService.createZoneType(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Zone type created successfully',
    data: result,
  });
});

const getAllZoneTypes = catchAsync(async (req: Request, res: Response) => {
  const result = await zoneTypeService.getAllZoneTypes(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Zone types fetched successfully',
    data: result,
  });
});

const getZoneTypeById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await zoneTypeService.getZoneTypeById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Zone type fetched successfully',
    data: result,
  });
});

const updateZoneType = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await zoneTypeService.updateZoneType(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Zone type updated successfully',
    data: result,
  });
});

const deleteZoneType = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await zoneTypeService.deleteZoneType(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Zone type deleted successfully',
    data: null,
  });
});

export const zoneTypeController = {
  createZoneType,
  getAllZoneTypes,
  getZoneTypeById,
  updateZoneType,
  deleteZoneType,
};
