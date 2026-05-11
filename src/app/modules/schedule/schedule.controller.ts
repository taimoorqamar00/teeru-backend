import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { scheduleService } from './schedule.service';

const createSchedule = catchAsync(async (req: Request, res: Response) => {
  const { timeSlots, timeSlot: incomingTimeSlot, ...rest } = req.body;

  // Normalise to an array of slots — one document will be created per slot
  const slots: string[] = Array.isArray(timeSlots) && timeSlots.length
    ? timeSlots
    : incomingTimeSlot
      ? [incomingTimeSlot]
      : [];

  if (!slots.length) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'At least one time slot is required',
      data: null,
    });
  }

  // Check conflicts for every slot before persisting any
  for (const slot of slots) {
    const conflictCheck = await scheduleService.checkScheduleConflict(
      rest.bayId,
      rest.date,
      slot,
      rest.duration,
    );

    if (conflictCheck.conflict) {
      return sendResponse(res, {
        statusCode: httpStatus.CONFLICT,
        success: false,
        message: `Time slot ${slot} overlaps with an existing schedule for this bay on this date`,
        data: conflictCheck.existingSchedule,
      });
    }
  }

  // Create one schedule document per slot
  const schedules = await Promise.all(
    slots.map(slot => scheduleService.createSchedule({ ...rest, timeSlot: slot })),
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: schedules.length === 1 ? 'Schedule created successfully' : `${schedules.length} schedules created successfully`,
    data: schedules.length === 1 ? schedules[0] : schedules,
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
  const { timeSlots, timeSlot: incomingTimeSlot, ...rest } = req.body;
  const updateData: any = { ...rest };

  // Resolve timeSlot — each schedule document holds exactly one slot
  if (incomingTimeSlot) {
    updateData.timeSlot = incomingTimeSlot;
  } else if (Array.isArray(timeSlots) && timeSlots.length) {
    updateData.timeSlot = timeSlots[0];
  }
  
  // Validate schedule ID format
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid schedule ID format',
      data: null,
    });
  }

  // Re-check conflict whenever any field that affects the time range changes
  if (updateData.bayId || updateData.date || updateData.timeSlot || updateData.duration !== undefined) {
    const existingSchedule = await scheduleService.getScheduleById(id);
    if (existingSchedule) {
      const existingBayId =
        typeof existingSchedule.bayId === 'object' && existingSchedule.bayId !== null
          ? (existingSchedule.bayId as any)._id.toString()
          : String(existingSchedule.bayId);

      const conflictCheck = await scheduleService.checkScheduleConflict(
        updateData.bayId || existingBayId,
        updateData.date || existingSchedule.date,
        updateData.timeSlot || existingSchedule.timeSlot,
        updateData.duration ?? existingSchedule.duration,
        id,
      );

      if (conflictCheck.conflict) {
        return sendResponse(res, {
          statusCode: httpStatus.CONFLICT,
          success: false,
          message: 'This time slot overlaps with an existing schedule for this bay on this date',
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
  const { bayId, date, timeSlot, duration, excludeId } = req.query;

  if (!bayId || !date || !timeSlot || !duration) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'bayId, date, timeSlot and duration are required',
      data: null,
    });
  }

  const conflictCheck = await scheduleService.checkScheduleConflict(
    bayId as string,
    date as string,
    timeSlot as string,
    Number(duration),
    excludeId as string,
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

const deleteSchedulesByBay = catchAsync(async (req: Request, res: Response) => {
  const { bayId } = req.params;

  if (!bayId || !/^[0-9a-fA-F]{24}$/.test(bayId)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid bay ID format',
      data: null,
    });
  }

  const result = await scheduleService.deleteSchedulesByBay(bayId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `${result.deletedCount} schedule(s) permanently deleted for bay`,
    data: result,
  });
});

const getAvailableSlots = catchAsync(async (req: Request, res: Response) => {
  const { bayId, date, duration } = req.query;

  if (!bayId || !date) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'bayId and date are required',
      data: null,
    });
  }

  if (!/^[0-9a-fA-F]{24}$/.test(bayId as string)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid bay ID format',
      data: null,
    });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date as string) || isNaN(Date.parse(date as string))) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'date must be in YYYY-MM-DD format',
      data: null,
    });
  }

  const slots = await scheduleService.getAvailableSlots(
    bayId as string,
    date as string,
    duration ? Number(duration) : undefined,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Available slots retrieved successfully',
    data: slots,
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
  getAvailableSlots,
  deleteSchedulesByBay,
};
