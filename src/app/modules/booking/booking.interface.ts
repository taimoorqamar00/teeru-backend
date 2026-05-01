import { Model } from 'mongoose';

export type TCustomerType = 'member' | 'walk-in' | 'pass';

export type TPaymentMethod = 'wave' | 'orange-money';

export type TBookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type TBayNumber = 1 | 2 | 3 | 4;

export type TDuration = number; // in hours, supports 0.5 increments

export interface TCustomerInfo {
  name: string;
  phone: string;
  email?: string;
}

export interface TBookingCreate {
  customerInfo: TCustomerInfo;
  customerType: TCustomerType;
  bayNumber: TBayNumber;
  duration: TDuration;
  totalAmount: number;
  paymentMethod: TPaymentMethod;
  bookingDate: Date;
  startTime: string; // HH:mm format
  status?: TBookingStatus;
  notes?: string;
  addOns?: string[];
}

export interface TBooking extends TBookingCreate {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

export interface TBookingUpdate {
  customerInfo?: Partial<TCustomerInfo>;
  customerType?: TCustomerType;
  bayNumber?: TBayNumber;
  duration?: TDuration;
  totalAmount?: number;
  paymentMethod?: TPaymentMethod;
  bookingDate?: Date;
  startTime?: string;
  status?: TBookingStatus;
  notes?: string;
  addOns?: string[];
}

export interface TBookingListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: TBookingStatus;
  customerType?: TCustomerType;
  bayNumber?: TBayNumber;
  dateFrom?: string;
  dateTo?: string;
  search?: string; // search by customer name or phone
}

export interface TBookingAvailability {
  bayNumber: TBayNumber;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export interface BookingModel extends Model<TBooking> {
  isBookingExist(
    bayNumber: TBayNumber,
    date: Date,
    startTime: string,
    duration: TDuration,
    excludeId?: string
  ): Promise<boolean>;
  
  findBookingsByDateRange(
    dateFrom: Date,
    dateTo: Date,
    filters?: Partial<TBookingListQuery>
  ): Promise<TBooking[]>;
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
