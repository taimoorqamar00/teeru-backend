import { Types } from 'mongoose';

export interface IZoneType {
  name: string;
  slug: string;
  description?: string;
  isDefault: boolean;
  isDeleted: boolean;
}

export interface IZoneTypeDocument extends IZoneType {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
