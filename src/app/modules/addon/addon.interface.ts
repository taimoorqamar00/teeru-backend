import { Types } from 'mongoose';

export type AddonStatus = 'active' | 'inactive';

export interface IAddon {
  name: string;
  price: number;
  status: AddonStatus;
  isDeleted: boolean;
}

export interface IAddonDocument extends IAddon {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
