import { Types } from 'mongoose';

export interface TMembershipPlan {
  _id: string;
  name: string;
  price: number;
  period: string;
  hoursPerMonth: number;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TShortTermPlan {
  _id: string;
  name: string;
  price: number;
  durationDays: number;
  hoursIncluded: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type TPlanType = 'membership' | 'short-term';

export type TSubscriptionStatus = 'active' | 'expiring' | 'expired';

export interface TSubscriptionCustomerInfo {
  name: string;
  phone: string;
  customerId?: Types.ObjectId;
}

export interface TMembershipSubscription {
  _id: string;
  customerInfo: TSubscriptionCustomerInfo;
  planId: Types.ObjectId;
  planName: string;
  planType: TPlanType;
  price: number;
  startDate: Date;
  expiryDate: Date;
  hoursLeft: number;
  hoursUsed: number;
  paymentMethod: 'wave' | 'orange-money' | 'paydunya';
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}
