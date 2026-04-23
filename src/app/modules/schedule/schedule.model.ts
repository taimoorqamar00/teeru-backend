import { Schema, model } from 'mongoose';
import { TSchedule, ScheduleModel } from './schedule.interface';

// Pricing schema
const pricingSchema = new Schema({
  standardRate: {
    type: Number,
    required: true,
    min: 0,
  },
  premiumRate: {
    type: Number,
    required: true,
    min: 0,
  },
  weekendRate: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

// Main schedule schema
const scheduleSchema = new Schema<TSchedule>(
  {
    bayId: {
      type: Schema.Types.ObjectId,
      ref: 'Bay',
      required: true,
    } as any,
    date: {
      type: String,
      required: true,
      validate: {
        validator: function (value: string) {
          // Validate YYYY-MM-DD format
          return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value));
        },
        message: 'Date must be in YYYY-MM-DD format',
      },
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 24, // Maximum 24 hours
      validate: {
        validator: function (value: number) {
          return Number.isInteger(value);
        },
        message: 'Duration must be an integer',
      },
    },
    pricing: {
      type: pricingSchema,
      required: true,
    },
    timeSlots: {
      type: [String],
      required: true,
      validate: {
        validator: function (timeSlots: string[]) {
          // Validate each time slot is in HH:mm format
          return timeSlots.every(slot => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(slot));
        },
        message: 'All time slots must be in HH:mm format',
      },
    },
    addOns: {
      type: [String],
      default: [],
      validate: {
        validator: function (addOns: string[]) {
          return addOns.length <= 50; // Maximum 50 add-ons
        },
        message: 'Maximum 50 add-ons allowed',
      },
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
scheduleSchema.index({ bayId: 1 });
scheduleSchema.index({ date: 1 });
scheduleSchema.index({ bayId: 1, date: 1 }); // Composite index for bay schedules
scheduleSchema.index({ isDeleted: 1 });

// Pre-save hook to validate unique schedule per bay per date
scheduleSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('bayId') || this.isModified('date')) {
    const existingSchedule = await Schedule.isScheduleExist(
      this.bayId.toString(),
      this.date,
      this._id
    );
    
    if (existingSchedule) {
      const error = new Error('Schedule already exists for this bay on this date');
      return next(error);
    }
  }
  next();
});

// Static method to check schedule existence
scheduleSchema.statics.isScheduleExist = async function (
  this: any,
  bayId: string,
  date: string,
  excludeId?: string
): Promise<boolean> {
  const query: any = {
    bayId,
    date,
    isDeleted: false,
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existingSchedule = await this.findOne(query);
  return !!existingSchedule;
} as any;

// Static method to find schedules by date range
scheduleSchema.statics.findSchedulesByDateRange = async function (
  this: any,
  dateFrom: string,
  dateTo: string,
  bayId?: string
): Promise<TSchedule[]> {
  const query: any = {
    date: {
      $gte: dateFrom,
      $lte: dateTo,
    },
    isDeleted: false,
  };

  if (bayId) {
    query.bayId = bayId;
  }

  return await this.find(query)
    .populate('bayId', 'name number hardware projector isActive')
    .sort({ date: 1, 'timeSlots.0': 1 });
} as any;

// Static method to find schedules by bay
scheduleSchema.statics.findSchedulesByBay = async function (this: any, bayId: string): Promise<TSchedule[]> {
  return await this.find({
    bayId,
    isDeleted: false,
  })
    .populate('bayId', 'name number hardware projector isActive')
    .sort({ date: 1 });
} as any;

// Filter out deleted documents
scheduleSchema.pre('find', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

scheduleSchema.pre('findOne', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

scheduleSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

export const Schedule = model<TSchedule, ScheduleModel>('Schedule', scheduleSchema);
