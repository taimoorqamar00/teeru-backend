import { Bay } from './bay.model';
import { Booking } from '../booking/booking.model';
import { Schedule } from '../schedule/schedule.model';
import { PricingRule } from '../pricingRule/pricingRule.model';
import { User } from '../user/user.models';
import { addonService } from '../addon/addon.service';
import { TBay, TBayCreate, TBayUpdate, TBayListQuery, TBaySchedule, IPaginationResult } from './bay.interface';
import mongoose from 'mongoose';
import AppError from '../../error/AppError';
import httpStatus from 'http-status';

const createBay = async (payload: TBayCreate): Promise<TBay> => {
  // Drop legacy unique index on number if it still exists in MongoDB
  try {
    await Bay.collection.dropIndex('number_1');
  } catch {
    // Already dropped or never existed — ignore
  }

  // If a soft-deleted bay with the same number exists, reactivate it
  const softDeleted = await Bay.collection.findOne({ number: payload.number, isDeleted: true });
  if (softDeleted) {
    const reactivated = await Bay.findByIdAndUpdate(
      softDeleted._id,
      { ...payload, isDeleted: false },
      { new: true, runValidators: true }
    );
    return reactivated as TBay;
  }

  const bay = await Bay.create(payload);
  return bay;
};

const getAllBays = async (query: TBayListQuery): Promise<IPaginationResult<any>> => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'number',
    sortOrder = 'asc',
    isActive,
    search,
  } = query;

  const filter: any = {};
  if (isActive !== undefined) filter.isActive = isActive;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { hardware: { $regex: search, $options: 'i' } },
      { projector: { $regex: search, $options: 'i' } },
    ];
  }

  const sort: any = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  const skip = (page - 1) * limit;

  const [bays, total] = await Promise.all([
    Bay.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Bay.countDocuments(filter),
  ]);

  // Enrich with live booking data (single query, no N+1)
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  const bayNumbers = bays.map((b) => b.number);
  const todayBookings = await Booking.find({
    bayNumber: { $in: bayNumbers },
    bookingDate: { $gte: todayStart, $lt: todayEnd },
    status: 'confirmed',
  }).lean();

  const now = new Date();

  // Group bookings by bayNumber
  const bookingsByBay = new Map<number, any[]>();
  for (const booking of todayBookings) {
    const list = bookingsByBay.get(booking.bayNumber) ?? [];
    list.push(booking);
    bookingsByBay.set(booking.bayNumber, list);
  }

  const enrichedBays = bays.map((bay) => {
    const bayBookings = bookingsByBay.get(bay.number) ?? [];
    const result: any = { ...bay };

    let upcomingStart: Date | null = null;

    for (const booking of bayBookings) {
      const [h, m] = booking.startTime.split(':').map(Number);
      const start = new Date(booking.bookingDate as Date);
      start.setUTCHours(h, m, 0, 0);
      const end = new Date(start.getTime() + booking.duration * 3600000);

      if (start <= now && now < end) {
        result.currentBooking = {
          _id: booking._id,
          customerName: booking.customerInfo?.name,
          remainingTime: Math.ceil((end.getTime() - now.getTime()) / 60000),
          endTime: `${end.getUTCHours().toString().padStart(2, '0')}:${end.getUTCMinutes().toString().padStart(2, '0')}`,
          addOns: booking.addOns ?? [],
        };
      } else if (start > now) {
        if (upcomingStart === null || start < upcomingStart) {
          upcomingStart = start;
          result.upcomingBooking = {
            _id: booking._id,
            startsIn: Math.ceil((start.getTime() - now.getTime()) / 60000),
          };
        }
      }
    }

    return result;
  });

  return {
    data: enrichedBays,
    meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
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

  const deletedBay = await Bay.findByIdAndDelete(id);

  if (deletedBay) {
    await Schedule.deleteMany({ bayId: id });
  }

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
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

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

const getBaysList = async (): Promise<Pick<TBay, '_id' | 'name' | 'number'>[]> => {
  const bays = await Bay.find({ isActive: true, isDeleted: { $ne: true } })
    .select('_id name number')
    .sort({ number: 1 })
    .lean();

  return bays as Pick<TBay, '_id' | 'name' | 'number'>[];
};

const getMyBays = async (userId: string, query: any): Promise<IPaginationResult<any>> => {
  const { page = 1, limit = 10, status } = query;

  // Get user details to match with bookings
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Build filter to find user's bookings by phone or email
  const bookingFilter: any = {
    isDeleted: false,
    $or: [] as any[],
  };

  if (user.phone) {
    bookingFilter.$or.push({ 'customerInfo.phone': user.phone });
  }
  if (user.email) {
    bookingFilter.$or.push({ 'customerInfo.email': user.email });
  }

  // If user has neither phone nor email, return empty
  if (bookingFilter.$or.length === 0) {
    return {
      data: [],
      meta: { page, limit, total: 0, totalPage: 0 },
    };
  }

  if (status) {
    bookingFilter.status = status;
  }

  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find(bookingFilter)
      .sort({ bookingDate: -1, startTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(bookingFilter),
  ]);

  // Get bay details for the booked bay numbers
  const bayNumbers = [...new Set(bookings.map((b) => b.bayNumber))];
  const bays = await Bay.find({ number: { $in: bayNumbers } })
    .select('_id name number hardware projector isActive')
    .lean();

  const bayMap = new Map(bays.map((b) => [b.number, b]));

  // Enrich bookings with bay details
  const enrichedBookings = bookings.map((booking) => {
    const bay = bayMap.get(booking.bayNumber);
    return {
      _id: booking._id,
      bayNumber: booking.bayNumber,
      bayName: bay?.name || `Bay ${booking.bayNumber}`,
      bayDetails: bay || null,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      duration: booking.duration,
      status: booking.status,
      totalAmount: booking.totalAmount,
      paymentMethod: booking.paymentMethod,
      addOns: booking.addOns,
      createdAt: booking.createdAt,
    };
  });

  return {
    data: enrichedBookings,
    meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
  };
};

const getBayDetails = async (bayId: string, date?: string): Promise<any> => {
  if (!mongoose.Types.ObjectId.isValid(bayId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid bay ID');
  }

  const bay = await Bay.findById(bayId).lean();
  if (!bay) {
    throw new AppError(httpStatus.NOT_FOUND, 'Bay not found');
  }

  // Use provided date or today
  const targetDate = date || new Date().toISOString().split('T')[0];

  // Get all schedule slots for this bay on the target date
  const schedules = await Schedule.find({
    bayId,
    date: targetDate,
    isDeleted: false,
  })
    .sort({ timeSlot: 1 })
    .lean();

  // Get bookings for this bay on the target date
  const startOfDay = new Date(targetDate);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const bookings = await Booking.find({
    bayNumber: bay.number,
    bookingDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['pending', 'confirmed'] },
    isDeleted: false,
  }).lean();

  // Get applicable pricing rules for this day
  const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const targetDayName = dayOfWeek[new Date(targetDate).getDay()];

  const pricingRules = await PricingRule.find({
    days: targetDayName,
    isActive: true,
    isDeleted: false,
  })
    .sort({ startTime: 1 })
    .lean();

  // Collect all unique add-on refs from schedules and resolve them to full Addon
  // documents (Schedule/Booking store add-ons as a mix of Addon _id and name)
  const allAddOnRefs = [...new Set(schedules.flatMap((s) => s.addOns || []))];
  const addonDocs = await addonService.getAddonsByRefs(allAddOnRefs);
  const addonByRef = new Map(
    addonDocs.flatMap((addon) => [[addon._id.toString(), addon], [addon.name, addon]] as const)
  );
  const resolveAddOns = (refs: string[]) =>
    refs.map((ref) => addonByRef.get(ref) || { _id: ref });
  const allAddOns = resolveAddOns(allAddOnRefs);

  // Build slots with availability status
  const slots = schedules.map((schedule) => {
    const slotStart = schedule.timeSlot;
    const slotEnd = calculateEndTime(slotStart, schedule.duration);

    // Check if this slot is booked
    const [slotH, slotM] = slotStart.split(':').map(Number);
    const slotStartMin = slotH * 60 + slotM;
    const slotEndMin = slotStartMin + schedule.duration * 60;

    const isBooked = bookings.some((booking) => {
      if (!booking.startTime) return false;
      const [bH, bM] = booking.startTime.split(':').map(Number);
      const bookingStartMin = bH * 60 + bM;
      const bookingEndMin = bookingStartMin + booking.duration * 60;
      return slotStartMin < bookingEndMin && bookingStartMin < slotEndMin;
    });

    const matchingBooking = isBooked
      ? bookings.find((booking) => {
          if (!booking.startTime) return false;
          const [bH, bM] = booking.startTime.split(':').map(Number);
          const bookingStartMin = bH * 60 + bM;
          const bookingEndMin = bookingStartMin + booking.duration * 60;
          return slotStartMin < bookingEndMin && bookingStartMin < slotEndMin;
        })
      : null;

    return {
      _id: schedule._id,
      timeSlot: slotStart,
      endTime: slotEnd,
      duration: schedule.duration,
      pricing: schedule.pricing,
      addOns: resolveAddOns(schedule.addOns || []),
      isAvailable: !isBooked,
      booking: matchingBooking
        ? {
            _id: matchingBooking._id,
            customerName: matchingBooking.customerInfo?.name,
            status: matchingBooking.status,
          }
        : null,
    };
  });

  return {
    _id: bay._id,
    name: bay.name,
    number: bay.number,
    hardware: bay.hardware,
    projector: bay.projector,
    isActive: bay.isActive,
    date: targetDate,
    slots,
    addOns: allAddOns,
    pricingRules: pricingRules.map((rule) => ({
      _id: rule._id,
      name: rule.name,
      startTime: rule.startTime,
      endTime: rule.endTime,
      pricePerHour: rule.pricePerHour,
      days: rule.days,
    })),
    totalSlots: slots.length,
    availableSlots: slots.filter((s) => s.isAvailable).length,
    bookedSlots: slots.filter((s) => !s.isAvailable).length,
  };
};

const bookBay = async (userId: string, payload: {
  bayId: string;
  scheduleId?: string;
  date: string;
  startTime: string;
  duration: number;
  paymentMethod: string;
  transactionId?: string;
  bookByMembership?: boolean;
  addOns?: string[];
  notes?: string;
}): Promise<any> => {
  // Get user details
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Get bay details
  if (!mongoose.Types.ObjectId.isValid(payload.bayId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid bay ID');
  }

  const bay = await Bay.findById(payload.bayId).lean();
  if (!bay) {
    throw new AppError(httpStatus.NOT_FOUND, 'Bay not found');
  }

  if (!bay.isActive) {
    throw new AppError(httpStatus.BAD_REQUEST, 'This bay is currently inactive');
  }

  // Check availability
  const bookingDate = new Date(payload.date);
  const isConflict = await Booking.isBookingExist(
    bay.number,
    bookingDate,
    payload.startTime,
    payload.duration
  );

  if (isConflict) {
    throw new AppError(httpStatus.CONFLICT, 'Bay is already booked for this time slot');
  }

  // ─── Membership Booking Flow ─────────────────────────────────────────────────
  if (payload.bookByMembership) {
    const { MembershipSubscription } = await import('../membership/membership.model');
    const { decrementMemberHours } = await import('../membership/membership.service');

    // Find active membership for this user
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const subscription = await MembershipSubscription.findOne({
      'customerInfo.customerId': user._id,
      expiryDate: { $gte: today },
      hoursLeft: { $gte: payload.duration },
    }).lean();

    if (!subscription) {
      throw new AppError(httpStatus.BAD_REQUEST, 'No active membership with sufficient hours found');
    }

    // Create the booking (no payment required, uses membership hours)
    const bookingPayload = {
      customerInfo: {
        name: user.fullName || user.email,
        phone: user.phone || '',
        email: user.email,
      },
      customerType: 'member' as const,
      bayNumber: bay.number,
      scheduleId: payload.scheduleId,
      duration: payload.duration,
      totalAmount: 0, // Free for members
      paymentMethod: 'membership' as const,
      bookingDate,
      startTime: payload.startTime,
      status: 'confirmed' as const, // Auto-confirm for members
      addOns: payload.addOns || [],
      notes: payload.notes,
    };

    const booking = await Booking.create(bookingPayload);

    // Deduct membership hours
    try {
      await decrementMemberHours(user.phone || '', payload.duration);
    } catch {
      // Non-critical: booking succeeded, hours decrement failed
    }

    return {
      bookingId: booking._id,
      status: booking.status,
      customerType: booking.customerType,
      bayDetails: {
        _id: bay._id,
        name: bay.name,
        number: bay.number,
        hardware: bay.hardware,
        projector: bay.projector,
      },
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: calculateEndTime(payload.startTime, payload.duration),
      duration: booking.duration,
      totalAmount: booking.totalAmount,
      paymentMethod: booking.paymentMethod,
      transactionId: booking.transactionId,
      addOns: booking.addOns,
      customerInfo: booking.customerInfo,
      notes: booking.notes,
      membership: {
        subscriptionId: subscription._id,
        planName: subscription.planName,
        hoursUsed: payload.duration,
      },
      createdAt: booking.createdAt,
    };
  }

  // ─── Regular Payment Flow (Walk-in) ──────────────────────────────────────────
  // For non-membership bookings, paymentMethod defaults to 'paydunya'
  const resolvedPaymentMethod = payload.paymentMethod || 'paydunya';

  // transaction_id is required for regular payment bookings
  if (!payload.transactionId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Transaction ID is required for payment bookings');
  }

  // Calculate total amount from pricing rules or schedule
  let totalAmount = 0;

  if (payload.scheduleId) {
    const schedule = await Schedule.findById(payload.scheduleId).lean() as any;
    if (schedule && schedule.pricing) {
      totalAmount = (schedule.pricing.standardRate || 0) * payload.duration;
    }
  }

  if (!totalAmount) {
    // Fallback: use pricing rules for the day
    const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const dayName = dayOfWeek[bookingDate.getDay()];

    const rule = await PricingRule.findOne({
      days: dayName,
      isActive: true,
      isDeleted: false,
    }).lean();

    if (rule) {
      totalAmount = rule.pricePerHour * payload.duration;
    } else {
      // Default rate
      totalAmount = 25000 * payload.duration;
    }
  }

  // Create the booking
  const bookingPayload = {
    customerInfo: {
      name: user.fullName || user.email,
      phone: user.phone || '',
      email: user.email,
    },
    customerType: 'mobile' as const,
    bayNumber: bay.number,
    scheduleId: payload.scheduleId,
    duration: payload.duration,
    totalAmount,
    paymentMethod: resolvedPaymentMethod as 'wave' | 'orange-money' | 'paydunya' | 'membership',
    transactionId: payload.transactionId,
    bookingDate,
    startTime: payload.startTime,
    status: 'confirmed' as const,
    addOns: payload.addOns || [],
    notes: payload.notes,
  };

  const booking = await Booking.create(bookingPayload);

  // Return enriched response
  return {
    bookingId: booking._id,
    status: booking.status,
    customerType: booking.customerType,
    bayDetails: {
      _id: bay._id,
      name: bay.name,
      number: bay.number,
      hardware: bay.hardware,
      projector: bay.projector,
    },
    bookingDate: booking.bookingDate,
    startTime: booking.startTime,
    endTime: calculateEndTime(payload.startTime, payload.duration),
    duration: booking.duration,
    totalAmount: booking.totalAmount,
    paymentMethod: booking.paymentMethod,
    transactionId: booking.transactionId,
    addOns: booking.addOns,
    customerInfo: booking.customerInfo,
    notes: booking.notes,
    createdAt: booking.createdAt,
  };
};

const checkSlotAvailability = async (scheduleId: string): Promise<{
  isAvailable: boolean;
  message: string;
  slot?: {
    _id: string;
    bayId: string;
    bayName: string;
    bayNumber: number;
    date: string;
    timeSlot: string;
    endTime: string;
    duration: number;
    pricing: object;
  };
}> => {
  if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid slot ID');
  }

  // Fetch the schedule slot
  const schedule = await Schedule.findById(scheduleId).lean() as any;
  if (!schedule) {
    throw new AppError(httpStatus.NOT_FOUND, 'Slot not found');
  }

  // Resolve bay number from bayId
  const bay = await Bay.findById(schedule.bayId).lean();
  if (!bay) {
    throw new AppError(httpStatus.NOT_FOUND, 'Bay associated with this slot not found');
  }

  // Parse slot time boundaries
  const [slotH, slotM] = (schedule.timeSlot as string).split(':').map(Number);
  const slotStartMin = slotH * 60 + slotM;
  const slotEndMin = slotStartMin + (schedule.duration as number) * 60;

  // Look for any active booking on the same bay that overlaps this slot
  const startOfDay = new Date(schedule.date as string);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(schedule.date as string);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const activeBookings = await Booking.find({
    bayNumber: (bay as any).number,
    bookingDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['pending', 'confirmed'] },
    isDeleted: false,
  }).lean();

  const isBooked = activeBookings.some((booking) => {
    if (!booking.startTime) return false;
    const [bH, bM] = (booking.startTime as string).split(':').map(Number);
    const bookingStartMin = bH * 60 + bM;
    const bookingEndMin = bookingStartMin + (booking.duration as number) * 60;
    // Strict overlap — boundary-sharing (e.g. 11:00–12:00 and 12:00–13:00) is allowed
    return slotStartMin < bookingEndMin && bookingStartMin < slotEndMin;
  });

  const slotData = {
    _id: schedule._id.toString(),
    bayId: schedule.bayId.toString(),
    bayName: (bay as any).name,
    bayNumber: (bay as any).number,
    date: schedule.date as string,
    timeSlot: schedule.timeSlot as string,
    endTime: calculateEndTime(schedule.timeSlot as string, schedule.duration as number),
    duration: schedule.duration as number,
    pricing: schedule.pricing,
  };

  if (isBooked) {
    return {
      isAvailable: false,
      message: 'This slot is already booked. Please choose a different time slot.',
      slot: slotData,
    };
  }

  return {
    isAvailable: true,
    message: 'This slot is available for booking.',
    slot: slotData,
  };
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
  getBaysList,
  getMyBays,
  getBayDetails,
  bookBay,
  checkSlotAvailability,
};
