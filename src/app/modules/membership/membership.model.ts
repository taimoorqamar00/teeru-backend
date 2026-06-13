import { Schema, model } from 'mongoose';
import { TMembershipPlan, TShortTermPlan, TMembershipSubscription } from './membership.interface';

const membershipPlanSchema = new Schema<TMembershipPlan>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    period: { type: String, default: 'monthly' },
    hoursPerMonth: { type: Number, required: true, min: 0 },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const shortTermPlanSchema = new Schema<TShortTermPlan>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    durationDays: { type: Number, required: true, min: 1 },
    hoursIncluded: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const subscriptionCustomerInfoSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false },
);

const membershipSubscriptionSchema = new Schema<TMembershipSubscription>(
  {
    customerInfo: { type: subscriptionCustomerInfoSchema, required: true },
    planId: { type: Schema.Types.ObjectId, required: true },
    planName: { type: String, required: true },
    planType: { type: String, enum: ['membership', 'short-term'], required: true },
    price: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    hoursLeft: { type: Number, required: true, min: 0 },
    hoursUsed: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['wave', 'orange-money', 'paydunya'], required: true },
    transactionId: { type: String, trim: true },
  },
  { timestamps: true },
);

membershipSubscriptionSchema.index({ expiryDate: 1 });
membershipSubscriptionSchema.index({ 'customerInfo.phone': 1 });

export const MembershipPlan = model<TMembershipPlan>('MembershipPlan', membershipPlanSchema);
export const ShortTermPlan = model<TShortTermPlan>('ShortTermPlan', shortTermPlanSchema);
export const MembershipSubscription = model<TMembershipSubscription>(
  'MembershipSubscription',
  membershipSubscriptionSchema,
);
