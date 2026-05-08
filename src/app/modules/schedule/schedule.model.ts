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
    timeSlot: {
      type: String,
      required: true,
      validate: {
        validator: function (slot: string) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(slot);
        },
        message: 'Time slot must be in HH:mm format',
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
scheduleSchema.index({ bayId: 1, date: 1, timeSlot: 1 }); // one slot per bay per date
scheduleSchema.index({ isDeleted: 1 });

// Pre-save hook to block overlapping time slots on the same bay+date
scheduleSchema.pre('save', async function (next) {
  const doc = this as any;
  if (doc.isNew || doc.isModified('bayId') || doc.isModified('date') || doc.isModified('timeSlot') || doc.isModified('duration')) {
    const conflict = await Schedule.isScheduleExist(
      doc.bayId.toString(),
      doc.date,
      doc.timeSlot,
      doc.duration,
      doc._id.toString(),
    );

    if (conflict) {
      return next(new Error('This time slot overlaps with an existing schedule for this bay on this date'));
    }
  }
  next();
});

// Returns the first conflicting schedule, or null if the slot is free.
// Two slots conflict when newStart < existEnd && existStart < newEnd (strict — boundary-sharing is allowed).
scheduleSchema.statics.isScheduleExist = async function (
  this: any,
  bayId: string,
  date: string,
  timeSlot: string,
  duration: number,
  excludeId?: string,
): Promise<TSchedule | null> {
  if (!timeSlot) return null;

  const [newH, newM] = timeSlot.split(':').map(Number);
  const newStart = newH * 60 + newM;
  const newEnd = newStart + duration * 60;

  const query: any = { bayId, date, isDeleted: false };
  if (excludeId) query._id = { $ne: excludeId };

  const existing: TSchedule[] = await this.find(query).lean();

  for (const doc of existing) {
    // Support legacy documents stored with timeSlots[] before the schema migration
    const slotStr: string | undefined = (doc as any).timeSlot ?? (doc as any).timeSlots?.[0];
    if (!slotStr) continue;

    const [exH, exM] = slotStr.split(':').map(Number);
    const exStart = exH * 60 + exM;
    const exEnd = exStart + (doc.duration as number) * 60;

    if (newStart < exEnd && exStart < newEnd) {
      return doc;
    }
  }

  return null;
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
    .sort({ date: 1, timeSlot: 1 });
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
