import { Model } from 'mongoose';

export interface TBayCreate {
  name: string;
  number: number;
  hardware: string;
  projector: string;
  isActive: boolean;
}

export interface TBay extends TBayCreate {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

export interface TBayUpdate {
  name?: string;
  number?: number;
  hardware?: string;
  projector?: string;
  isActive?: boolean;
}

export interface TBayListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string; // search by name
}

export interface TBaySchedule {
  bayId: string;
  bayName: string;
  bayNumber: number;
  date: string; // YYYY-MM-DD format
  bookings: Array<{
    id: string;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    customerName: string;
    status: string;
  }>;
  availableSlots: Array<{
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
  }>;
}

export interface BayModel extends Model<TBay> {
  isBayNumberExist(
    number: number,
    excludeId?: string
  ): Promise<boolean>;
  
  findActiveBays(): Promise<TBay[]>;
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
