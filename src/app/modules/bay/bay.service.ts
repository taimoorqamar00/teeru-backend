import { Bay } from './bay.model';
import { TBay, TBayCreate, TBayUpdate, TBayListQuery, TBaySchedule, IPaginationResult } from './bay.interface';
import mongoose from 'mongoose';

const createBay = async (payload: TBayCreate): Promise<TBay> => {
  const bay = await Bay.create(payload);
  return bay;
};

const getAllBays = async (query: TBayListQuery): Promise<IPaginationResult<TBay>> => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'number',
    sortOrder = 'asc',
    isActive,
    search,
  } = query;

  // Build filter conditions
  const filter: any = {};

  if (isActive !== undefined) filter.isActive = isActive;

  // Search filter (name, hardware, or projector)
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { hardware: { $regex: search, $options: 'i' } },
      { projector: { $regex: search, $options: 'i' } },
    ];
  }

  // Sort options
  const sort: any = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Calculate skip value for pagination
  const skip = (page - 1) * limit;

  // Execute query with pagination
  const [bays, total] = await Promise.all([
    Bay.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Bay.countDocuments(filter),
  ]);

  const meta = {
    page,
    limit,
    total,
    totalPage: Math.ceil(total / limit),
  };

  return {
    data: bays,
    meta,
  };
};

const getBayById = async (id: string): Promise<TBay | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid bay ID');
  }

  const bay = await Bay.findById(id);
  return bay;
};

const updateBay = async (id: string, payload: TBayUpdate): Promise<TBay | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid bay ID');
  }

  const updatedBay = await Bay.findByIdAndUpdate(
    id,
    { ...payload, updatedAt: new Date() },
    { new: true, runValidators: true }
  );

  return updatedBay;
};

const deleteBay = async (id: string): Promise<TBay | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid bay ID');
  }

  const deletedBay = await Bay.findByIdAndUpdate(
    id,
    { isDeleted: true, updatedAt: new Date() },
    { new: true }
  );

  return deletedBay;
};

const getActiveBays = async (): Promise<TBay[]> => {
  return await Bay.findActiveBays();
};


const getBaySchedule = async (date: string): Promise<TBaySchedule[]> => {
  // Get all active bays
  const bays = await Bay.findActiveBays();
  
  // Get bookings for the specified date
  const Booking = mongoose.model('Booking');
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const bookings = await Booking.find({
    bookingDate: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
    status: { $in: ['pending', 'confirmed'] },
    isDeleted: false,
  }).select('bayNumber startTime duration customerInfo.status customerInfo.name').lean();

  const schedules: TBaySchedule[] = [];

  for (const bay of bays) {
    const bayBookings = bookings
      .filter(booking => booking.bayNumber === bay.number)
      .map(booking => ({
        id: booking._id?.toString() || '',
        startTime: booking.startTime || '',
        endTime: calculateEndTime(booking.startTime || '', booking.duration || 1),
        customerName: (booking.customerInfo as any)?.name || 'Unknown',
        status: booking.status || 'pending',
      }));

    const availableSlots = calculateAvailableSlots(bayBookings);

    schedules.push({
      bayId: bay._id,
      bayName: bay.name,
      bayNumber: bay.number,
      date,
      bookings: bayBookings,
      availableSlots,
    });
  }

  return schedules;
};

const getBayStatistics = async (): Promise<{
  totalBays: number;
  activeBays: number;
  inactiveBays: number;
}> => {
  const stats = await Bay.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        totalBays: { $sum: 1 },
        activeBays: {
          $sum: { $cond: ['$isActive', 1, 0] },
        },
        inactiveBays: {
          $sum: { $cond: ['$isActive', 0, 1] },
        },
      },
    },
  ]);

  const result = stats[0] || {
    totalBays: 0,
    activeBays: 0,
    inactiveBays: 0,
  };

  return result;
};

// Helper function to calculate end time
const calculateEndTime = (startTime: string, duration: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endHours = hours + duration;
  const finalHours = endHours % 24;
  return `${finalHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Helper function to calculate available slots
const calculateAvailableSlots = (bookings: Array<{ startTime: string; endTime: string }>): Array<{ startTime: string; endTime: string }> => {
  const slots: Array<{ startTime: string; endTime: string }> = [];
  const workingHoursStart = '08:00'; // 8 AM
  const workingHoursEnd = '22:00';  // 10 PM

  // Sort bookings by start time
  const sortedBookings = bookings.sort((a, b) => a.startTime.localeCompare(b.startTime));

  let currentTime = workingHoursStart;

  for (const booking of sortedBookings) {
    if (currentTime < booking.startTime) {
      slots.push({
        startTime: currentTime,
        endTime: booking.startTime,
      });
    }
    currentTime = booking.endTime > currentTime ? booking.endTime : currentTime;
  }

  // Add final slot if there's time left
  if (currentTime < workingHoursEnd) {
    slots.push({
      startTime: currentTime,
      endTime: workingHoursEnd,
    });
  }

  return slots;
};

export const bayService = {
  createBay,
  getAllBays,
  getBayById,
  updateBay,
  deleteBay,
  getActiveBays,
  getBaySchedule,
  getBayStatistics,
};
