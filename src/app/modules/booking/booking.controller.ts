import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { bookingService } from './booking.service';

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const bookingData = req.body;
  
  const booking = await bookingService.createBooking(bookingData);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Booking created successfully',
    data: booking,
  });
});

const getAllBookings = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  
  const result = await bookingService.getAllBookings(query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bookings retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getMyBookings = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  
  const result = await bookingService.getAllBookings(query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'My bookings retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getBookingById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Validate booking ID format
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid booking ID format',
      data: null,
    });
  }
  
  const booking = await bookingService.getBookingById(id);

  if (!booking) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Booking not found',
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking retrieved successfully',
    data: booking,
  });
});

const updateBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  
  // Validate booking ID format
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid booking ID format',
      data: null,
    });
  }
  
  const booking = await bookingService.updateBooking(id, updateData);

  if (!booking) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Booking not found',
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking updated successfully',
    data: booking,
  });
});

const deleteBooking = catchAsync(async (req: Request, res: Response) => {
  console.log('=== DELETE BOOKING DEBUG ===');
  console.log('req.params:', req.params);
  console.log('req.params.id:', req.params.id);
  console.log('typeof req.params.id:', typeof req.params.id);
  console.log('req.url:', req.url);
  console.log('req.method:', req.method);
  console.log('==========================');
  
  const { id } = req.params;
  
  // Validate booking ID format
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    console.log('ID validation failed - id:', id);
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid booking ID format',
      data: null,
    });
  }
  
  const booking = await bookingService.deleteBooking(id);

  if (!booking) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Booking not found',
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking cancelled successfully',
    data: booking,
  });
});

const checkBayAvailability = catchAsync(async (req: Request, res: Response) => {
  const { bayNumber, date } = req.query;
  const { startTime, duration, excludeId } = req.body;
  
  const availability = await bookingService.checkBayAvailability(
    Number(bayNumber),
    new Date(date as string),
    startTime,
    duration,
    excludeId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: availability.available 
      ? 'Bay is available for the selected time slot' 
      : 'Bay is not available for the selected time slot',
    data: availability,
  });
});

const getTodayBookings = catchAsync(async (req: Request, res: Response) => {
  const bookings = await bookingService.getTodayBookings();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Today\'s bookings retrieved successfully',
    data: bookings,
  });
});

const getUpcomingBookings = catchAsync(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  
  const bookings = await bookingService.getUpcomingBookings(limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Upcoming bookings retrieved successfully',
    data: bookings,
  });
});

const getBookingStatistics = catchAsync(async (req: Request, res: Response) => {
  const { dateFrom, dateTo } = req.query;
  
  const statistics = await bookingService.getBookingStatistics(
    dateFrom ? new Date(dateFrom as string) : undefined,
    dateTo ? new Date(dateTo as string) : undefined
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking statistics retrieved successfully',
    data: statistics,
  });
});

const getBookingsByDateRange = catchAsync(async (req: Request, res: Response) => {
  const { dateFrom, dateTo } = req.query;
  const filters = req.query;
  
  if (!dateFrom || !dateTo) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Both dateFrom and dateTo are required',
      data: null,
    });
  }

  const bookings = await bookingService.getBookingsByDateRange(
    new Date(dateFrom as string),
    new Date(dateTo as string),
    filters
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bookings retrieved successfully for the specified date range',
    data: bookings,
  });
});

const extendSession = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { duration, addOns } = req.body;

  const booking = await bookingService.extendSession(id, duration, addOns);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Session extended successfully',
    data: booking,
  });
});

const endSession = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const booking = await bookingService.endSession(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Session ended successfully',
    data: booking,
  });
});

export const bookingController = {
  createBooking,
  getAllBookings,
  getMyBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  checkBayAvailability,
  getTodayBookings,
  getUpcomingBookings,
  getBookingStatistics,
  getBookingsByDateRange,
  extendSession,
  endSession,
};
