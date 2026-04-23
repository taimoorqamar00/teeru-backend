import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { scheduleService } from './schedule.service';

const createSchedule = catchAsync(async (req: Request, res: Response) => {
  const scheduleData = req.body;
  
  // Check for schedule conflict
  const conflictCheck = await scheduleService.checkScheduleConflict(
    scheduleData.bayId,
    scheduleData.date
  );

  if (conflictCheck.conflict) {
    return sendResponse(res, {
      statusCode: httpStatus.CONFLICT,
      success: false,
      message: 'Schedule already exists for this bay on this date',
      data: conflictCheck.existingSchedule,
    });
  }
  
  const schedule = await scheduleService.createSchedule(scheduleData);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Schedule created successfully',
    data: schedule,
  });
});

const getAllSchedules = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  
  const result = await scheduleService.getAllSchedules(query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Schedules retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getScheduleById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Validate schedule ID format
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid schedule ID format',
      data: null,
    });
  }
  
  const schedule = await scheduleService.getScheduleById(id);

  if (!schedule) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Schedule not found',
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Schedule retrieved successfully',
    data: schedule,
  });
});

const updateSchedule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  
  // Validate schedule ID format
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid schedule ID format',
      data: null,
    });
  }

  // Check for conflict if bayId or date is being updated
  if (updateData.bayId || updateData.date) {
    const existingSchedule = await scheduleService.getScheduleById(id);
    if (existingSchedule) {
      const conflictCheck = await scheduleService.checkScheduleConflict(
        updateData.bayId || existingSchedule.bayId.toString(),
        updateData.date || existingSchedule.date,
        id
      );

      if (conflictCheck.conflict) {
        return sendResponse(res, {
          statusCode: httpStatus.CONFLICT,
          success: false,
          message: 'Schedule conflict detected for the updated bay and date',
          data: conflictCheck.existingSchedule,
        });
      }
    }
  }
  
  const schedule = await scheduleService.updateSchedule(id, updateData);

  if (!schedule) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Schedule not found',
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Schedule updated successfully',
    data: schedule,
  });
});

const deleteSchedule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Validate schedule ID format
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid schedule ID format',
      data: null,
    });
  }
  
  const schedule = await scheduleService.deleteSchedule(id);

  if (!schedule) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Schedule not found',
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Schedule deleted successfully',
    data: schedule,
  });
});

const getSchedulesByDateRange = catchAsync(async (req: Request, res: Response) => {
  const { dateFrom, dateTo, bayId } = req.query;
  
  if (!dateFrom || !dateTo) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Both dateFrom and dateTo are required',
      data: null,
    });
  }

  const schedules = await scheduleService.getSchedulesByDateRange(
    dateFrom as string,
    dateTo as string,
    bayId as string
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Schedules retrieved successfully for the specified date range',
    data: schedules,
  });
});

const getSchedulesByBay = catchAsync(async (req: Request, res: Response) => {
  const { bayId } = req.params;
  
  // Validate bay ID format
  if (!bayId || !/^[0-9a-fA-F]{24}$/.test(bayId)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid bay ID format',
      data: null,
    });
  }

  const schedules = await scheduleService.getSchedulesByBay(bayId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bay schedules retrieved successfully',
    data: schedules,
  });
});

const getScheduleStatistics = catchAsync(async (req: Request, res: Response) => {
  const { dateFrom, dateTo } = req.query;
  
  const statistics = await scheduleService.getScheduleStatistics(
    dateFrom as string,
    dateTo as string
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Schedule statistics retrieved successfully',
    data: statistics,
  });
});

const checkScheduleConflict = catchAsync(async (req: Request, res: Response) => {
  const { bayId, date, excludeId } = req.query;
  
  if (!bayId || !date) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'bayId and date are required',
      data: null,
    });
  }

  const conflictCheck = await scheduleService.checkScheduleConflict(
    bayId as string,
    date as string,
    excludeId as string
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: conflictCheck.conflict 
      ? 'Schedule conflict detected' 
      : 'No schedule conflict found',
    data: conflictCheck,
  });
});

export const scheduleController = {
  createSchedule,
  getAllSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  getSchedulesByDateRange,
  getSchedulesByBay,
  getScheduleStatistics,
  checkScheduleConflict,
};
