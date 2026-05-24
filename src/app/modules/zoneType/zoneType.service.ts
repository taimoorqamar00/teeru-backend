import ZoneType from './zoneType.model';
import AppError from '../../error/AppError';
import httpStatus from 'http-status';
import { IZoneType } from './zoneType.interface';
import QueryBuilder from '../../builder/QueryBuilder';

const createZoneType = async (data: Partial<IZoneType>) => {
  // Generate slug from name if not provided
  if (!data.slug) {
    data.slug = data.name!
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Check if zone type with this slug already exists
  const existing = await ZoneType.findOne({ slug: data.slug, isDeleted: false });
  if (existing) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Zone type with this name already exists');
  }

  const zoneType = new ZoneType(data);
  await zoneType.save();
  return zoneType;
};

const getAllZoneTypes = async (query: Record<string, unknown>) => {
  const zoneQuery = new QueryBuilder(ZoneType.find({ isDeleted: false }), query)
    .search(['name', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await zoneQuery.modelQuery;
  const meta = await zoneQuery.countTotal();
  return { meta, result };
};

const getZoneTypeById = async (id: string) => {
  const zoneType = await ZoneType.findById(id);
  if (!zoneType || zoneType.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Zone type not found');
  }
  return zoneType;
};

const updateZoneType = async (id: string, data: Partial<IZoneType>) => {
  // If name is being updated, regenerate slug
  if (data.name && !data.slug) {
    data.slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Check for duplicate slug if slug is changing
  if (data.slug) {
    const existing = await ZoneType.findOne({ slug: data.slug, isDeleted: false, _id: { $ne: id } });
    if (existing) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Zone type with this name already exists');
    }
  }

  const updatedZoneType = await ZoneType.findByIdAndUpdate(id, data, { new: true });
  if (!updatedZoneType) {
    throw new AppError(httpStatus.NOT_FOUND, 'Zone type not found');
  }
  return updatedZoneType;
};

const deleteZoneType = async (id: string) => {
  const zoneType = await ZoneType.findById(id);
  if (!zoneType) {
    throw new AppError(httpStatus.NOT_FOUND, 'Zone type not found');
  }
  if (zoneType.isDefault) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Cannot delete a default zone type');
  }

  await ZoneType.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  return null;
};

export const zoneTypeService = {
  createZoneType,
  getAllZoneTypes,
  getZoneTypeById,
  updateZoneType,
  deleteZoneType,
};
