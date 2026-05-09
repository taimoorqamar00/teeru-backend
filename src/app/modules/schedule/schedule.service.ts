import { Schedule } from './schedule.model';
import { TSchedule, TScheduleCreate, TScheduleUpdate, TScheduleListQuery, IPaginationResult } from './schedule.interface';
import { Bay } from '../bay/bay.model';
import { Booking } from '../booking/booking.model';
import mongoose from 'mongoose';

const createSchedule = async (payload: TScheduleCreate): Promise<TSchedule> => {
  const schedule = await Schedule.create(payload);
  const populatedSchedule = await Schedule.findById(schedule._id).populate('bayId', 'name number hardware projector isActive');
  return populatedSchedule as TSchedule;
};

const getAllSchedules = async (query: TScheduleListQuery): Promise<IPaginationResult<TSchedule>> => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'date',
    sortOrder = 'asc',
    bayId,
    dateFrom,
    dateTo,
    search,
  } = query;

  // Build filter conditions
  const filter: any = {};

  if (bayId) filter.bayId = bayId;
  
  // Date range filter
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = dateFrom;
    if (dateTo) filter.date.$lte = dateTo;
  }

  // Search filter (search in populated bay fields)
  if (search) {
    filter.$or = [
      { 'bayId.name': { $regex: search, $options: 'i' } },
      { 'bayId.hardware': { $regex: search, $options: 'i' } },
      { 'bayId.projector': { $regex: search, $options: 'i' } },
    ];
  }

  // Sort options
  const sort: any = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Calculate skip value for pagination
  const skip = (page - 1) * limit;

  // Execute query with pagination
  const [schedules, total] = await Promise.all([
    Schedule.find(filter)
      .populate('bayId', 'name number hardware projector isActive')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Schedule.countDocuments(filter),
  ]);

  const meta = {
    page,
    limit,
    total,
    totalPage: Math.ceil(total / limit),
  };

  return {
    data: schedules,
    meta,
  };
};

const getScheduleById = async (id: string): Promise<TSchedule | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid schedule ID');
  }

  const schedule = await Schedule.findById(id).populate('bayId', 'name number hardware projector isActive');
  return schedule;
};

const updateSchedule = async (id: string, payload: TScheduleUpdate): Promise<TSchedule | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid schedule ID');
  }

  const updatedSchedule = await Schedule.findByIdAndUpdate(
    id,
    { ...payload, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).populate('bayId', 'name number hardware projector isActive');

  return updatedSchedule;
};

const deleteSchedule = async (id: string): Promise<TSchedule | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid schedule ID');
  }

  const deletedSchedule = await Schedule.findByIdAndUpdate(
    id,
    { isDeleted: true, updatedAt: new Date() },
    { new: true }
  ).populate('bayId', 'name number hardware projector isActive');

  return deletedSchedule;
};

const getSchedulesByDateRange = async (
  dateFrom: string,
  dateTo: string,
  bayId?: string
): Promise<TSchedule[]> => {
  return await Schedule.findSchedulesByDateRange(dateFrom, dateTo, bayId);
};

const getSchedulesByBay = async (bayId: string): Promise<TSchedule[]> => {
  return await Schedule.findSchedulesByBay(bayId);
};

const getScheduleStatistics = async (dateFrom?: string, dateTo?: string): Promise<{
  totalSchedules: number;
  activeSchedules: number;
  averageDuration: number;
  averageStandardRate: number;
  averagePremiumRate: number;
  averageWeekendRate: number;
}> => {
  const matchStage: any = { isDeleted: false };
  
  if (dateFrom || dateTo) {
    matchStage.date = {};
    if (dateFrom) matchStage.date.$gte = dateFrom;
    if (dateTo) matchStage.date.$lte = dateTo;
  }

  const stats = await Schedule.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalSchedules: { $sum: 1 },
        averageDuration: { $avg: '$duration' },
        averageStandardRate: { $avg: '$pricing.standardRate' },
        averagePremiumRate: { $avg: '$pricing.premiumRate' },
        averageWeekendRate: { $avg: '$pricing.weekendRate' },
      },
    },
  ]);

  const result = stats[0] || {
    totalSchedules: 0,
    averageDuration: 0,
    averageStandardRate: 0,
    averagePremiumRate: 0,
    averageWeekendRate: 0,
  };

  return {
    ...result,
    activeSchedules: result.totalSchedules, // All non-deleted schedules are considered active
    averageDuration: Math.round(result.averageDuration * 100) / 100,
    averageStandardRate: Math.round(result.averageStandardRate * 100) / 100,
    averagePremiumRate: Math.round(result.averagePremiumRate * 100) / 100,
    averageWeekendRate: Math.round(result.averageWeekendRate * 100) / 100,
  };
};

const checkScheduleConflict = async (
  bayId: string,
  date: string,
  timeSlot: string,
  duration: number,
  excludeId?: string,
): Promise<{ conflict: boolean; existingSchedule?: TSchedule }> => {
  const conflicting = await Schedule.isScheduleExist(bayId, date, timeSlot, duration, excludeId);

  if (conflicting) {
    return { conflict: true, existingSchedule: conflicting };
  }

  return { conflict: false };
};

const getAvailableSlots = async (
  bayId: string,
  date: string,
  duration?: number,
): Promise<TSchedule[]> => {
  // 1. Fetch all schedule slots for this bay+date (pre-find hook excludes soft-deleted)
  const filter: any = { bayId, date };
  if (duration !== undefined) filter.duration = duration;

  const schedules = (await Schedule.find(filter).sort({ timeSlot: 1 }).lean()) as TSchedule[];
  if (!schedules.length) return [];

  // 2. Resolve bayNumber — bookings are indexed by number, not ObjectId
  const bay = await Bay.findById(bayId).lean();
  if (!bay) return [];

  // 3. All active bookings for this bay on this date
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const bookings = await Booking.find({
    bayNumber: (bay as any).number,
    bookingDate: { $gte: dayStart, $lte: dayEnd },
    status: { $in: ['pending', 'confirmed'] },
  }).lean();

  // 4. Drop slots that overlap with any existing booking (strict interval check)
  return schedules.filter(slot => {
    const [sh, sm] = (slot.timeSlot as string).split(':').map(Number);
    const slotStart = sh * 60 + sm;
    const slotEnd = slotStart + (slot.duration as number) * 60;

    return !bookings.some(booking => {
      const [bh, bm] = (booking.startTime as string).split(':').map(Number);
      const bookingStart = bh * 60 + bm;
      const bookingEnd = bookingStart + (booking.duration as number) * 60;
      return slotStart < bookingEnd && bookingStart < slotEnd;
    });
  });
};

const deleteSchedulesByBay = async (bayId: string): Promise<{ deletedCount: number }> => {
  if (!mongoose.Types.ObjectId.isValid(bayId)) {
    throw new Error('Invalid bay ID');
  }

  const result = await Schedule.deleteMany({ bayId });
  return { deletedCount: result.deletedCount };
};

export const scheduleService = {
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
