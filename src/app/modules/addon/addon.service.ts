import Addon from './addon.model';
import AppError from '../../error/AppError';
import httpStatus from 'http-status';
import { IAddon } from './addon.interface';
import QueryBuilder from '../../builder/QueryBuilder';

const createAddon = async (data: Partial<IAddon>) => {
  const addon = new Addon(data);
  await addon.save();
  return addon;
};

const getAllAddons = async (query: Record<string, unknown>) => {
  const addonQuery = new QueryBuilder(Addon.find({ isDeleted: false }), query)
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await addonQuery.modelQuery;
  const meta = await addonQuery.countTotal();
  return { meta, result };
};

const getAddonById = async (id: string) => {
  const addon = await Addon.findById(id);
  if (!addon || addon.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Addon not found');
  }
  return addon;
};

const updateAddon = async (id: string, data: Partial<IAddon>) => {
  const updatedAddon = await Addon.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true }
  );
  if (!updatedAddon) {
    throw new AppError(httpStatus.NOT_FOUND, 'Addon not found');
  }
  return updatedAddon;
};

const deleteAddon = async (id: string) => {
  const addon = await Addon.findOne({ _id: id, isDeleted: false });
  if (!addon) {
    throw new AppError(httpStatus.NOT_FOUND, 'Addon not found');
  }

  await Addon.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  return null;
};

export const addonService = {
  createAddon,
  getAllAddons,
  getAddonById,
  updateAddon,
  deleteAddon,
};
