import { Booking } from './booking.model';
import { TBooking, TBookingCreate, TBookingUpdate, TBookingListQuery, TBayNumber, IPaginationResult } from './booking.interface';
import mongoose from 'mongoose';
import AppError from '../../error/AppError';

// Pricing constants (can be moved to config)
const BAY_RATES = {
  1: 25000, // 25,000 FCFA per hour
  2: 25000,
  3: 25000,
  4: 25000,
};

const ADD_ON_PRICES: Record<string, number> = {
  'Golf Club Rental': 10000,
  'Coaching Session': 20000,
};

const createBooking = async (payload: TBookingCreate): Promise<TBooking> => {
  // Validate and calculate total amount if not provided
  if (!payload.totalAmount) {
    payload.totalAmount = BAY_RATES[payload.bayNumber as keyof typeof BAY_RATES] * payload.duration;
  }

  const booking = await Booking.create(payload);
  return booking;
};

const getAllBookings = async (query: TBookingListQuery): Promise<IPaginationResult<TBooking>> => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'bookingDate',
    sortOrder = 'desc',
    status,
    customerType,
    bayNumber,
    dateFrom,
    dateTo,
    search,
  } = query;

  // Build filter conditions
  const filter: any = {};

  if (status) filter.status = status;
  if (customerType) filter.customerType = customerType;
  if (bayNumber) filter.bayNumber = bayNumber;
  
  // Date range filter
  if (dateFrom || dateTo) {
    filter.bookingDate = {};
    if (dateFrom) filter.bookingDate.$gte = dateFrom;
    if (dateTo) filter.bookingDate.$lte = dateTo;
  }

  // Search filter (customer name or phone)
  if (search) {
    filter.$or = [
      { 'customerInfo.name': { $regex: search, $options: 'i' } },
      { 'customerInfo.phone': { $regex: search, $options: 'i' } },
      { 'customerInfo.email': { $regex: search, $options: 'i' } },
    ];
  }

  // Sort options
  const sort: any = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Calculate skip value for pagination
  const skip = (page - 1) * limit;

  // Execute query with pagination
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  const meta = {
    page,
    limit,
    total,
    totalPage: Math.ceil(total / limit),
  };

  return {
    data: bookings,
    meta,
  };
};

const getBookingById = async (id: string): Promise<TBooking | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid booking ID');
  }

  const booking = await Booking.findById(id);
  return booking;
};

const updateBooking = async (id: string, payload: TBookingUpdate): Promise<TBooking | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid booking ID');
  }

  // Recalculate total amount if duration or bay number changed
  if (payload.duration || payload.bayNumber) {
    const existingBooking = await Booking.findById(id);
    if (!existingBooking) {
      throw new Error('Booking not found');
    }

    const newDuration = payload.duration || existingBooking.duration;
    const newBayNumber = payload.bayNumber || existingBooking.bayNumber;
    payload.totalAmount = BAY_RATES[newBayNumber as keyof typeof BAY_RATES] * newDuration;
  }

  const updatedBooking = await Booking.findByIdAndUpdate(
    id,
    { ...payload, updatedAt: new Date() },
    { new: true, runValidators: true }
  );

  return updatedBooking;
};

const deleteBooking = async (id: string): Promise<TBooking | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid booking ID');
  }

  const deletedBooking = await Booking.findByIdAndUpdate(
    id,
    { isDeleted: true, status: 'cancelled', updatedAt: new Date() },
    { new: true }
  );

  return deletedBooking;
};

const getBookingsByDateRange = async (
  dateFrom: Date,
  dateTo: Date,
  filters?: Partial<TBookingListQuery>
): Promise<TBooking[]> => {
  return await Booking.findBookingsByDateRange(dateFrom, dateTo, filters);
};

const checkBayAvailability = async (
  bayNumber: number,
  date: Date,
  startTime: string,
  duration: number,
  excludeId?: string
): Promise<{ available: boolean; conflictingBookings?: TBooking[] }> => {
  const isBooked = await Booking.isBookingExist(bayNumber as TBayNumber, date, startTime, duration, excludeId);
  
  if (isBooked) {
    // Find conflicting bookings to return details
    const conflictingBookings = await Booking.find({
      bayNumber,
      bookingDate: new Date(date),
      status: { $in: ['pending', 'confirmed'] },
      isDeleted: false,
      ...(excludeId && { _id: { $ne: excludeId } }),
    });

    return {
      available: false,
      conflictingBookings,
    };
  }

  return {
    available: true,
  };
};

const getTodayBookings = async (): Promise<TBooking[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await Booking.find({
    bookingDate: {
      $gte: today,
      $lt: tomorrow,
    },
    isDeleted: false,
  }).sort({ startTime: 1 });
};

const getUpcomingBookings = async (limit: number = 10): Promise<TBooking[]> => {
  const now = new Date();
  
  return await Booking.find({
    bookingDate: { $gte: now },
    status: { $in: ['pending', 'confirmed'] },
    isDeleted: false,
  })
    .sort({ bookingDate: 1, startTime: 1 })
    .limit(limit);
};

const getBookingStatistics = async (dateFrom?: Date, dateTo?: Date): Promise<{
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
}> => {
  const matchStage: any = { isDeleted: false };
  
  if (dateFrom || dateTo) {
    matchStage.bookingDate = {};
    if (dateFrom) matchStage.bookingDate.$gte = dateFrom;
    if (dateTo) matchStage.bookingDate.$lte = dateTo;
  }

  const stats = await Booking.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        confirmedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
        },
        cancelledBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
        },
        completedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        totalRevenue: {
          $sum: { $cond: [{ $in: ['$status', ['confirmed', 'completed']] }, '$totalAmount', 0] },
        },
      },
    },
  ]);

  const result = stats[0] || {
    totalBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
  };

  return {
    ...result,
    averageBookingValue: result.totalBookings > 0 ? result.totalRevenue / result.totalBookings : 0,
  };
};

const extendSession = async (
  id: string,
  extraDuration: number,
  addOns: string[] = [],
): Promise<TBooking> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, 'Invalid booking ID');
  }

  const booking = await Booking.findById(id);
  if (!booking) throw new AppError(404, 'Booking not found');
  if (booking.status !== 'confirmed') {
    throw new AppError(400, 'Only confirmed bookings can be extended');
  }

  const [h, m] = booking.startTime.split(':').map(Number);
  const start = new Date(booking.bookingDate as Date);
  start.setHours(h, m, 0, 0);
  const currentEnd = new Date(start.getTime() + booking.duration * 3600000);
  const now = new Date();

  if (now < start || now >= currentEnd) {
    throw new AppError(400, 'Session is not currently active');
  }

  if (extraDuration > 0) {
    const hasConflict = await Booking.isBookingExist(
      booking.bayNumber as TBayNumber,
      booking.bookingDate as Date,
      booking.startTime,
      booking.duration + extraDuration,
      id,
    );
    if (hasConflict) {
      throw new AppError(409, 'Extension conflicts with an existing booking');
    }
    booking.duration += extraDuration;
  }

  const bayRate = BAY_RATES[booking.bayNumber as keyof typeof BAY_RATES] ?? 25000;
  const extraCost =
    bayRate * extraDuration +
    addOns.reduce((sum, name) => sum + (ADD_ON_PRICES[name] ?? 0), 0);

  booking.totalAmount += extraCost;
  if (addOns.length > 0) {
    (booking.addOns as string[]) = [...((booking.addOns as string[]) ?? []), ...addOns];
  }

  await booking.save();
  return booking;
};

const endSession = async (id: string): Promise<TBooking> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, 'Invalid booking ID');
  }

  const booking = await Booking.findById(id);
  if (!booking) throw new AppError(404, 'Booking not found');
  if (booking.status !== 'confirmed') {
    throw new AppError(400, 'Only confirmed bookings can be ended');
  }

  booking.status = 'completed';
  await booking.save();
  return booking;
};

export const bookingService = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  getBookingsByDateRange,
  checkBayAvailability,
  getTodayBookings,
  getUpcomingBookings,
  getBookingStatistics,
  extendSession,
  endSession,
};
