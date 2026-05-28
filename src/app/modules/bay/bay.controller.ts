import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { bayService } from './bay.service';

const createBay = catchAsync(async (req: Request, res: Response) => {
  const bayData = req.body;
  
  const bay = await bayService.createBay(bayData);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Bay created successfully',
    data: bay,
  });
});

const getAllBays = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  
  const result = await bayService.getAllBays(query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bays retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getBayById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Validate bay ID format
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid bay ID format',
      data: null,
    });
  }
  
  const bay = await bayService.getBayById(id);

  if (!bay) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Bay not found',
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bay retrieved successfully',
    data: bay,
  });
});

const updateBay = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  
  // Validate bay ID format
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid bay ID format',
      data: null,
    });
  }
  
  const bay = await bayService.updateBay(id, updateData);

  if (!bay) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Bay not found',
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bay updated successfully',
    data: bay,
  });
});

const deleteBay = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Validate bay ID format
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid bay ID format',
      data: null,
    });
  }
  
  const bay = await bayService.deleteBay(id);

  if (!bay) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Bay not found',
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bay deleted successfully',
    data: bay,
  });
});

const getBaySchedule = catchAsync(async (req: Request, res: Response) => {
  const { date } = req.query;
  
  if (!date || typeof date !== 'string') {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Date parameter is required and must be in YYYY-MM-DD format',
      data: null,
    });
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date))) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid date format. Please use YYYY-MM-DD format',
      data: null,
    });
  }

  const schedule = await bayService.getBaySchedule(date);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Bay schedule retrieved successfully for ${date}`,
    data: schedule,
  });
});

const getActiveBays = catchAsync(async (req: Request, res: Response) => {
  const bays = await bayService.getActiveBays();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Active bays retrieved successfully',
    data: bays,
  });
});


const getBayStatistics = catchAsync(async (req: Request, res: Response) => {
  const statistics = await bayService.getBayStatistics();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bay statistics retrieved successfully',
    data: statistics,
  });
});

const getLiveBays = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;

  const result = await bayService.getAllBays(query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Live bay status retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getBaysList = catchAsync(async (req: Request, res: Response) => {
  const bays = await bayService.getBaysList();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bays list retrieved successfully',
    data: bays,
  });
});

const getMyBays = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const query = req.query;

  const result = await bayService.getMyBays(userId, query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'My booked bays retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getBayDetails = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { date } = req.query;

  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid bay ID format',
      data: null,
    });
  }

  const bayDetails = await bayService.getBayDetails(id, date as string | undefined);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bay details retrieved successfully',
    data: bayDetails,
  });
});

const bookBay = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const bookingData = req.body;

  const result = await bayService.bookBay(userId, bookingData);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Bay booked successfully',
    data: result,
  });
});

export const bayController = {
  createBay,
  getAllBays,
  getLiveBays,
  getBayById,
  updateBay,
  deleteBay,
  getBaySchedule,
  getActiveBays,
  getBayStatistics,
  getBaysList,
  getMyBays,
  getBayDetails,
  bookBay,
};
