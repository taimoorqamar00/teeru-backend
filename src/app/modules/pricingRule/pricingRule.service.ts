import mongoose from 'mongoose';
import { PricingRule } from './pricingRule.model';
import {
  TPricingRule,
  TPricingRuleCreate,
  TPricingRuleUpdate,
  TPricingRuleListQuery,
  IPaginationResult,
} from './pricingRule.interface';

const createPricingRule = async (payload: TPricingRuleCreate): Promise<TPricingRule> => {
  const rule = await PricingRule.create(payload);
  return rule;
};

const getAllPricingRules = async (
  query: TPricingRuleListQuery,
): Promise<IPaginationResult<TPricingRule>> => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search,
    isActive,
  } = query;

  const filter: any = {};
  if (isActive !== undefined) filter.isActive = isActive;
  if (search) {
    filter.$or = [{ name: { $regex: search, $options: 'i' } }];
  }

  const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    PricingRule.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    PricingRule.countDocuments(filter),
  ]);

  return {
    data: data as TPricingRule[],
    meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
  };
};

const getPricingRuleById = async (id: string): Promise<TPricingRule | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid pricing rule ID');
  return PricingRule.findById(id);
};

const updatePricingRule = async (
  id: string,
  payload: TPricingRuleUpdate,
): Promise<TPricingRule | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid pricing rule ID');
  return PricingRule.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
};

const deletePricingRule = async (id: string): Promise<TPricingRule | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid pricing rule ID');
  return PricingRule.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
};

export const pricingRuleService = {
  createPricingRule,
  getAllPricingRules,
  getPricingRuleById,
  updatePricingRule,
  deletePricingRule,
};
