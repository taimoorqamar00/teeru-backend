import { Model } from 'mongoose';

export interface TPricing {
  standardRate: number;
  premiumRate: number;
  weekendRate: number;
}

export interface TScheduleCreate {
  bayId: string;
  date: string; // YYYY-MM-DD format
  duration: number; // in hours
  pricing: TPricing;
  timeSlots: string[]; // Array of time strings like ["10:00", "14:00"]
  addOns?: string[];
}

export interface TSchedule extends TScheduleCreate {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

export interface TScheduleUpdate {
  bayId?: string;
  date?: string;
  duration?: number;
  pricing?: TPricing;
  timeSlots?: string[];
  addOns?: string[];
}

export interface TScheduleListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  bayId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ScheduleModel extends Model<TSchedule> {
  isScheduleExist(
    bayId: string,
    date: string,
    excludeId?: string
  ): Promise<boolean>;
  
  findSchedulesByDateRange(
    dateFrom: string,
    dateTo: string,
    bayId?: string
  ): Promise<TSchedule[]>;
  
  findSchedulesByBay(bayId: string): Promise<TSchedule[]>;
}

export interface IPaginationOption {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IPaginationResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
}
