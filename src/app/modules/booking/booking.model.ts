import { Schema, model } from 'mongoose';
import { TBooking, BookingModel } from './booking.interface';

// Customer info schema
const customerInfoSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  { _id: false }
);

// Main booking schema
const bookingSchema = new Schema<TBooking>(
  {
    customerInfo: {
      type: customerInfoSchema,
      required: true,
    },
    customerType: {
      type: String,
      enum: ['member', 'walk-in'],
      required: true,
    },
    bayNumber: {
      type: Number,
      enum: [1, 2, 3, 4],
      required: true,
    },
    duration: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['wave', 'orange-money'],
      required: true,
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: function (time: string) {
          // Validate HH:mm format
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
        },
        message: 'Start time must be in HH:mm format',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

// Indexes for better query performance
bookingSchema.index({ bayNumber: 1, bookingDate: 1, startTime: 1 });
bookingSchema.index({ 'customerInfo.phone': 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingDate: 1 });
bookingSchema.index({ isDeleted: 1 });

// Virtual for endTime calculation
bookingSchema.virtual('endTime').get(function () {
  const [hours, minutes] = this.startTime.split(':').map(Number);
  const endHours = hours + this.duration;
  const endMinutes = minutes;
  
  // Handle overflow beyond 24 hours
  const finalHours = endHours % 24;
  return `${finalHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
});

// Pre-save hook to validate booking availability
bookingSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('bayNumber') || this.isModified('bookingDate') || this.isModified('startTime') || this.isModified('duration')) {
    const existingBooking = await Booking.isBookingExist(
      this.bayNumber,
      this.bookingDate,
      this.startTime,
      this.duration,
      this._id
    );
    
    if (existingBooking) {
      const error = new Error('Bay is already booked for this time slot');
      return next(error);
    }
  }
  next();
});

// Static method to check booking existence
bookingSchema.statics.isBookingExist = async function (
  bayNumber: number,
  date: Date,
  startTime: string,
  duration: number,
  excludeId?: string
): Promise<boolean> {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = startTotalMinutes + (duration * 60);

  const query: any = {
    bayNumber,
    bookingDate: new Date(date),
    status: { $in: ['pending', 'confirmed'] },
    isDeleted: false,
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existingBookings = await this.find(query);

  for (const booking of existingBookings) {
    const [existingStartHours, existingStartMinutes] = booking.startTime.split(':').map(Number);
    const existingStartTotalMinutes = existingStartHours * 60 + existingStartMinutes;
    const existingEndTotalMinutes = existingStartTotalMinutes + (booking.duration * 60);

    // Check for time overlap
    if (
      (startTotalMinutes >= existingStartTotalMinutes && startTotalMinutes < existingEndTotalMinutes) ||
      (endTotalMinutes > existingStartTotalMinutes && endTotalMinutes <= existingEndTotalMinutes) ||
      (startTotalMinutes <= existingStartTotalMinutes && endTotalMinutes >= existingEndTotalMinutes)
    ) {
      return true; // Overlap found
    }
  }

  return false; // No overlap
};

// Static method to find bookings by date range
bookingSchema.statics.findBookingsByDateRange = async function (
  dateFrom: Date,
  dateTo: Date,
  filters?: any
): Promise<TBooking[]> {
  const query: any = {
    bookingDate: {
      $gte: new Date(dateFrom),
      $lte: new Date(dateTo),
    },
    isDeleted: false,
  };

  if (filters) {
    if (filters.status) query.status = filters.status;
    if (filters.customerType) query.customerType = filters.customerType;
    if (filters.bayNumber) query.bayNumber = filters.bayNumber;
    if (filters.search) {
      query.$or = [
        { 'customerInfo.name': { $regex: filters.search, $options: 'i' } },
        { 'customerInfo.phone': { $regex: filters.search, $options: 'i' } },
      ];
    }
  }

  return await this.find(query).sort({ bookingDate: 1, startTime: 1 });
};

// Filter out deleted documents
bookingSchema.pre('find', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

bookingSchema.pre('findOne', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

bookingSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

export const Booking = model<TBooking, BookingModel>('Booking', bookingSchema);
