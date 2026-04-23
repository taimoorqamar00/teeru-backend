import { Schedule } from './schedule.model';
import { TSchedule, TScheduleCreate, TScheduleUpdate, TScheduleListQuery, IPaginationResult } from './schedule.interface';
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
  excludeId?: string
): Promise<{ conflict: boolean; existingSchedule?: TSchedule }> => {
  const isExist = await Schedule.isScheduleExist(bayId, date, excludeId);
  
  if (isExist) {
    const existingSchedule = await Schedule.findOne({
      bayId,
      date,
      isDeleted: false,
      ...(excludeId && { _id: { $ne: excludeId } }),
    }).populate('bayId', 'name number hardware projector isActive');

    return {
      conflict: true,
      existingSchedule: existingSchedule as TSchedule,
    };
  }

  return {
    conflict: false,
  };
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
};
