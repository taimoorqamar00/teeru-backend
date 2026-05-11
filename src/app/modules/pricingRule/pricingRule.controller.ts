import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { pricingRuleService } from './pricingRule.service';

const createPricingRule = catchAsync(async (req: Request, res: Response) => {
  const rule = await pricingRuleService.createPricingRule(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Pricing rule created successfully',
    data: rule,
  });
});

const getAllPricingRules = catchAsync(async (req: Request, res: Response) => {
  const result = await pricingRuleService.getAllPricingRules(req.query as any);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Pricing rules retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getPricingRuleById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const rule = await pricingRuleService.getPricingRuleById(id);
  if (!rule) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Pricing rule not found',
      data: null,
    });
  }
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Pricing rule retrieved successfully',
    data: rule,
  });
});

const updatePricingRule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const rule = await pricingRuleService.updatePricingRule(id, req.body);
  if (!rule) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Pricing rule not found',
      data: null,
    });
  }
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Pricing rule updated successfully',
    data: rule,
  });
});

const deletePricingRule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const rule = await pricingRuleService.deletePricingRule(id);
  if (!rule) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Pricing rule not found',
      data: null,
    });
  }
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Pricing rule deleted successfully',
    data: rule,
  });
});

export const pricingRuleController = {
  createPricingRule,
  getAllPricingRules,
  getPricingRuleById,
  updatePricingRule,
  deletePricingRule,
};
