import { Request, Response } from 'express';
import { addonService } from './addon.service';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';

const createAddon = catchAsync(async (req: Request, res: Response) => {
  const result = await addonService.createAddon(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Addon created successfully',
    data: result,
  });
});

const getAllAddons = catchAsync(async (req: Request, res: Response) => {
  const result = await addonService.getAllAddons(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Addons fetched successfully',
    data: result,
  });
});

const getAddonById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await addonService.getAddonById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Addon fetched successfully',
    data: result,
  });
});

const updateAddon = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await addonService.updateAddon(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Addon updated successfully',
    data: result,
  });
});

const deleteAddon = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await addonService.deleteAddon(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Addon deleted successfully',
    data: null,
  });
});

export const addonController = {
  createAddon,
  getAllAddons,
  getAddonById,
  updateAddon,
  deleteAddon,
};
