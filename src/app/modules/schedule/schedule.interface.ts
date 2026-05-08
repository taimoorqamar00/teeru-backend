import { Model } from 'mongoose';

export interface TPricing {
  standardRate: number;
  premiumRate: number;
  weekendRate: number;
}

export interface TScheduleCreate {
  bayId: string;
  date: string; // YYYY-MM-DD format
  timeSlot: string; // HH:mm start time — one document per slot
  duration: number; // in hours (integer)
  pricing: TPricing;
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
  timeSlot?: string;
  duration?: number;
  pricing?: TPricing;
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
    timeSlot: string,
    duration: number,
    excludeId?: string
  ): Promise<TSchedule | null>;
  
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
