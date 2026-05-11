import { Schema, model } from 'mongoose';
import { TPricingRule, PricingRuleModel } from './pricingRule.interface';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

const pricingRuleSchema = new Schema<TPricingRule>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    days: {
      type: [String],
      enum: DAYS,
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'At least one day must be selected',
      },
    },
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
        message: 'startTime must be in HH:mm format',
      },
    },
    endTime: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
        message: 'endTime must be in HH:mm format',
      },
    },
    pricePerHour: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

pricingRuleSchema.index({ isDeleted: 1 });
pricingRuleSchema.index({ isActive: 1 });
pricingRuleSchema.index({ name: 'text' });

pricingRuleSchema.pre('find', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

pricingRuleSchema.pre('findOne', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

pricingRuleSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

export const PricingRule = model<TPricingRule, PricingRuleModel>('PricingRule', pricingRuleSchema);