import { Types } from 'mongoose';

export type ZoneTypeStatus = 'active' | 'inactive';

export interface IZoneType {
  name: string;
  slug: string;
  description?: string;
  status: ZoneTypeStatus;
  isDefault: boolean;
  isDeleted: boolean;
}

export interface IZoneTypeDocument extends IZoneType {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
