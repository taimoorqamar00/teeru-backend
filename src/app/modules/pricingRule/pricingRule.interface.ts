import { Model } from 'mongoose';

export type TDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export interface TPricingRuleCreate {
  name: string;
  days: TDay[];
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  pricePerHour: number; // FCFA
}

export interface TPricingRule extends TPricingRuleCreate {
  _id: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TPricingRuleUpdate {
  name?: string;
  days?: TDay[];
  startTime?: string;
  endTime?: string;
  pricePerHour?: number;
  isActive?: boolean;
}

export interface TPricingRuleListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  isActive?: boolean;
}

export interface PricingRuleModel extends Model<TPricingRule> {}

export interface IPaginationResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
}