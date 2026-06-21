import { Schema, model } from 'mongoose';
import { IAddon } from './addon.interface';

const AddonSchema = new Schema<IAddon>(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Addon = model<IAddon>('Addon', AddonSchema);

export default Addon;
