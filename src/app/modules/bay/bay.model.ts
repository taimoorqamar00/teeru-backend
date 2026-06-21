import { Schema, model } from 'mongoose';
import { TBay, BayModel } from './bay.interface';

// Main bay schema
const baySchema = new Schema<TBay>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    number: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
      validate: {
        validator: function (value: number) {
          return Number.isInteger(value);
        },
        message: 'Bay number must be an integer',
      },
    },
    hardware: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    projector: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
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
// Note: {number: 1} index is already created by unique:true on the field definition
baySchema.index({ isActive: 1 });
baySchema.index({ isDeleted: 1 });
baySchema.index({ name: 'text', hardware: 'text', projector: 'text' });

// Pre-save hook to validate unique bay number
baySchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('number')) {
    const existingBay = await Bay.isBayNumberExist(
      this.number,
      this._id
    );
    
    if (existingBay) {
      const error = new Error('Bay number already exists');
      return next(error);
    }
  }
  next();
});

// Static method to check bay number existence
baySchema.statics.isBayNumberExist = async function (
  number: number,
  excludeId?: string
): Promise<boolean> {
  const query: any = {
    number,
    isDeleted: false,
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existingBay = await this.findOne(query);
  return !!existingBay;
};

// Static method to find active bays
baySchema.statics.findActiveBays = async function (): Promise<TBay[]> {
  return await this.find({
    isActive: true,
    isDeleted: false,
  }).sort({ number: 1 });
};

// Filter out deleted documents
baySchema.pre('find', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

baySchema.pre('findOne', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

baySchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

export const Bay = model<TBay, BayModel>('Bay', baySchema);
