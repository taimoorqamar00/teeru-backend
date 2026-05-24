import { Schema, model } from 'mongoose';
import { IZoneType } from './zoneType.interface';

const ZoneTypeSchema = new Schema<IZoneType>(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      default: '',
    },
    isDefault: {
      type: Boolean,
      default: false,
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

const ZoneType = model<IZoneType>('ZoneType', ZoneTypeSchema);

export default ZoneType;
