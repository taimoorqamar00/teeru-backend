import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { membershipService } from './membership.service';

const getStats = catchAsync(async (_req: Request, res: Response) => {
  const data = await membershipService.getStats();
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Stats retrieved successfully', data });
});

const getAllPlans = catchAsync(async (_req: Request, res: Response) => {
  const data = await membershipService.getAllPlans();
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Plans retrieved successfully', data });
});

const getAllMembershipPlans = catchAsync(async (_req: Request, res: Response) => {
  const data = await membershipService.getAllMembershipPlans();
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Membership plans retrieved successfully', data });
});

const getMemberships = catchAsync(async (_req: Request, res: Response) => {
  const data = await membershipService.getMemberships();
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Memberships retrieved successfully', data });
});

const getMembershipDetails = catchAsync(async (req: Request, res: Response) => {
  const data = await membershipService.getMembershipDetails(req.params.id);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Membership details retrieved successfully', data });
});

const purchaseMembership = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const data = await membershipService.purchaseMembership(userId, req.body);
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: 'Membership purchased successfully', data });
});

const createPlan = catchAsync(async (req: Request, res: Response) => {
  const data = await membershipService.createPlan(req.body);
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: 'Plan created successfully', data });
});

const updatePlan = catchAsync(async (req: Request, res: Response) => {
  const data = await membershipService.updatePlan(req.params.id, req.body);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Plan updated successfully', data });
});

const togglePlan = catchAsync(async (req: Request, res: Response) => {
  const data = await membershipService.togglePlan(req.params.id);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Plan status toggled successfully', data });
});

const getAllShortTermPlans = catchAsync(async (_req: Request, res: Response) => {
  const data = await membershipService.getAllShortTermPlans();
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Short-term plans retrieved successfully', data });
});

const createShortTermPlan = catchAsync(async (req: Request, res: Response) => {
  const data = await membershipService.createShortTermPlan(req.body);
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: 'Short-term plan created successfully', data });
});

const updateShortTermPlan = catchAsync(async (req: Request, res: Response) => {
  const data = await membershipService.updateShortTermPlan(req.params.id, req.body);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Short-term plan updated successfully', data });
});

const getMembers = catchAsync(async (req: Request, res: Response) => {
  const result = await membershipService.getMembers(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Members retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const assignMembership = catchAsync(async (req: Request, res: Response) => {
  const data = await membershipService.assignMembership(req.body);
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: 'Membership assigned successfully', data });
});

const assignShortTermPlan = catchAsync(async (req: Request, res: Response) => {
  const data = await membershipService.assignShortTermPlan(req.body);
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: 'Short-term plan assigned successfully', data });
});

const renewSubscription = catchAsync(async (req: Request, res: Response) => {
  const data = await membershipService.renewSubscription(req.params.id);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Subscription renewed successfully', data });
});

const getMyMembership = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const data = await membershipService.getMyMembership(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: data ? 'My membership retrieved successfully' : 'No active membership found',
    data,
  });
});

export const membershipController = {
  getStats,
  getAllPlans,
  getAllMembershipPlans,
  getMemberships,
  getMembershipDetails,
  purchaseMembership,
  createPlan,
  updatePlan,
  togglePlan,
  getAllShortTermPlans,
  createShortTermPlan,
  updateShortTermPlan,
  getMembers,
  assignMembership,
  assignShortTermPlan,
  renewSubscription,
  getMyMembership,
};
