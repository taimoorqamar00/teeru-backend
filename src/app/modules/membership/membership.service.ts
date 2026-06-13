import mongoose from 'mongoose';
import AppError from '../../error/AppError';
import { MembershipPlan, MembershipSubscription, ShortTermPlan } from './membership.model';
import { TSubscriptionStatus } from './membership.interface';

const computeStatus = (expiryDate: Date): TSubscriptionStatus => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  if (expiryDate < today) return 'expired';
  if (expiryDate <= in7Days) return 'expiring';
  return 'active';
};

const parseDate = (dateStr: string): Date => new Date(dateStr + 'T00:00:00Z');

// ─── Stats ────────────────────────────────────────────────────────────────────

const getStats = async () => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));

  const [activeMembers, expiringIn7Days, revenueResult] = await Promise.all([
    MembershipSubscription.countDocuments({ expiryDate: { $gte: today } }),
    MembershipSubscription.countDocuments({ expiryDate: { $gte: today, $lte: in7Days } }),
    MembershipSubscription.aggregate([
      { $match: { createdAt: { $gte: monthStart, $lt: monthEnd } } },
      { $group: { _id: null, total: { $sum: '$price' } } },
    ]),
  ]);

  return {
    activeMembers,
    expiringIn7Days,
    monthlyRevenue: revenueResult[0]?.total ?? 0,
  };
};

// ─── Membership Plans ─────────────────────────────────────────────────────────

const getAllPlans = async () => {
  return MembershipPlan.find().sort({ price: 1 }).lean();
};

const getAllMembershipPlans = async () => {
  const [membershipPlans, shortTermPlans] = await Promise.all([
    MembershipPlan.find({ isActive: true }).sort({ price: 1 }).lean(),
    ShortTermPlan.find({ isActive: true }).sort({ price: 1 }).lean(),
  ]);

  return {
    membershipPlans: membershipPlans.map((plan) => ({
      _id: plan._id,
      name: plan.name,
      price: plan.price,
      period: plan.period,
      hoursPerMonth: plan.hoursPerMonth,
      features: plan.features,
      type: 'membership',
    })),
    shortTermPlans: shortTermPlans.map((plan) => ({
      _id: plan._id,
      name: plan.name,
      price: plan.price,
      durationDays: plan.durationDays,
      hoursIncluded: plan.hoursIncluded,
      type: 'short-term',
    })),
  };
};

const getMemberships = async () => {
  const [membershipPlans, shortTermPlans] = await Promise.all([
    MembershipPlan.find({ isActive: true }).sort({ price: 1 }).lean(),
    ShortTermPlan.find({ isActive: true }).sort({ price: 1 }).lean(),
  ]);

  const memberships = [
    ...membershipPlans.map((plan) => ({
      _id: plan._id,
      name: plan.name,
      price: plan.price,
      period: plan.period,
      hoursPerMonth: plan.hoursPerMonth,
      features: plan.features,
      type: 'membership' as const,
    })),
    ...shortTermPlans.map((plan) => ({
      _id: plan._id,
      name: plan.name,
      price: plan.price,
      period: `${plan.durationDays} days`,
      hoursPerMonth: plan.hoursIncluded,
      features: [] as string[],
      type: 'short-term' as const,
    })),
  ];

  return memberships;
};

const getMembershipDetails = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid membership ID');

  // Try membership plan first
  const membershipPlan = await MembershipPlan.findById(id).lean();
  if (membershipPlan) {
    return {
      _id: membershipPlan._id,
      name: membershipPlan.name,
      price: membershipPlan.price,
      period: membershipPlan.period,
      hoursPerMonth: membershipPlan.hoursPerMonth,
      features: membershipPlan.features,
      isActive: membershipPlan.isActive,
      type: 'membership',
    };
  }

  // Try short-term plan
  const shortTermPlan = await ShortTermPlan.findById(id).lean();
  if (shortTermPlan) {
    return {
      _id: shortTermPlan._id,
      name: shortTermPlan.name,
      price: shortTermPlan.price,
      period: `${shortTermPlan.durationDays} days`,
      durationDays: shortTermPlan.durationDays,
      hoursIncluded: shortTermPlan.hoursIncluded,
      isActive: shortTermPlan.isActive,
      type: 'short-term',
    };
  }

  throw new AppError(404, 'Membership not found');
};

const purchaseMembership = async (userId: string, payload: {
  planId: string;
  planType: 'membership' | 'short-term';
  paymentMethod: 'wave' | 'orange-money' | 'paydunya';
  transactionId: string;
}) => {
  const { planId, planType, paymentMethod, transactionId } = payload;

  // Get user info
  const { User } = await import('../user/user.models');
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let planName: string;
  let price: number;
  let expiryDate: Date;
  let hoursLeft: number;

  if (planType === 'membership') {
    const plan = await MembershipPlan.findById(planId);
    if (!plan) throw new AppError(404, 'Membership plan not found');
    if (!plan.isActive) throw new AppError(400, 'This plan is currently inactive');

    planName = plan.name;
    price = plan.price;
    hoursLeft = plan.hoursPerMonth;
    expiryDate = new Date(today);
    expiryDate.setUTCMonth(expiryDate.getUTCMonth() + 1);
  } else {
    const plan = await ShortTermPlan.findById(planId);
    if (!plan) throw new AppError(404, 'Short-term plan not found');
    if (!plan.isActive) throw new AppError(400, 'This plan is currently inactive');

    planName = plan.name;
    price = plan.price;
    hoursLeft = plan.hoursIncluded;
    expiryDate = new Date(today.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
  }

  const subscription = await MembershipSubscription.create({
    customerInfo: {
      name: user.fullName || user.email,
      phone: user.phone || '',
      customerId: user._id,
    },
    planId,
    planName,
    planType,
    price,
    startDate: today,
    expiryDate,
    hoursLeft,
    hoursUsed: 0,
    paymentMethod,
    transactionId,
  });

  return {
    _id: subscription._id,
    planName: subscription.planName,
    planType: subscription.planType,
    price: subscription.price,
    startDate: subscription.startDate,
    expiryDate: subscription.expiryDate,
    hoursLeft: subscription.hoursLeft,
    paymentMethod: subscription.paymentMethod,
    transactionId: subscription.transactionId,
  };
};

const createPlan = async (payload: {
  name: string;
  price: number;
  hoursPerMonth: number;
  features?: string[];
}) => {
  return MembershipPlan.create({ ...payload, period: 'monthly' });
};

const updatePlan = async (id: string, payload: Partial<{
  name: string;
  price: number;
  hoursPerMonth: number;
  features: string[];
}>) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid plan ID');

  const plan = await MembershipPlan.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!plan) throw new AppError(404, 'Membership plan not found');
  return plan;
};

const togglePlan = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid plan ID');

  const plan = await MembershipPlan.findById(id);
  if (!plan) throw new AppError(404, 'Membership plan not found');

  plan.isActive = !plan.isActive;
  await plan.save();
  return plan;
};

// ─── Short-Term Plans ─────────────────────────────────────────────────────────

const getAllShortTermPlans = async () => {
  return ShortTermPlan.find().sort({ durationDays: 1 }).lean();
};

const createShortTermPlan = async (payload: {
  name: string;
  price: number;
  durationDays: number;
  hoursIncluded: number;
}) => {
  return ShortTermPlan.create(payload);
};

const updateShortTermPlan = async (id: string, payload: Partial<{
  name: string;
  price: number;
  durationDays: number;
  hoursIncluded: number;
}>) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid plan ID');

  const plan = await ShortTermPlan.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!plan) throw new AppError(404, 'Short-term plan not found');
  return plan;
};

// ─── Subscriptions ────────────────────────────────────────────────────────────

const getMembers = async (query: { page?: number; limit?: number }) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const [subscriptions, total] = await Promise.all([
    MembershipSubscription.find()
      .sort({ expiryDate: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    MembershipSubscription.countDocuments(),
  ]);

  const data = subscriptions.map((sub) => ({
    _id: sub._id,
    customerName: sub.customerInfo.name,
    phone: sub.customerInfo.phone,
    planName: sub.planName,
    planId: sub.planId,
    planType: sub.planType,
    startDate: sub.startDate,
    expiryDate: sub.expiryDate,
    hoursLeft: sub.hoursLeft,
    hoursUsed: sub.hoursUsed,
    status: computeStatus(sub.expiryDate),
    paymentMethod: sub.paymentMethod,
  }));

  return {
    data,
    meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
  };
};

const assignMembership = async (payload: {
  customerInfo: { name: string; phone: string; customerId?: string };
  planId: string;
  startDate: string;
  expiryDate: string;
  paymentMethod: 'wave' | 'orange-money' | 'paydunya';
}) => {
  const plan = await MembershipPlan.findById(payload.planId);
  if (!plan) throw new AppError(404, 'Membership plan not found');
  if (!plan.isActive) throw new AppError(400, 'This plan is currently inactive');

  const subscription = await MembershipSubscription.create({
    customerInfo: payload.customerInfo,
    planId: plan._id,
    planName: plan.name,
    planType: 'membership',
    price: plan.price,
    startDate: parseDate(payload.startDate),
    expiryDate: parseDate(payload.expiryDate),
    hoursLeft: plan.hoursPerMonth,
    hoursUsed: 0,
    paymentMethod: payload.paymentMethod,
  });

  return subscription;
};

const assignShortTermPlan = async (payload: {
  customerInfo: { name: string; phone: string; customerId?: string };
  planId: string;
  startDate: string;
  paymentMethod: 'wave' | 'orange-money' | 'paydunya';
}) => {
  const plan = await ShortTermPlan.findById(payload.planId);
  if (!plan) throw new AppError(404, 'Short-term plan not found');
  if (!plan.isActive) throw new AppError(400, 'This plan is currently inactive');

  const startDate = parseDate(payload.startDate);
  const expiryDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  const subscription = await MembershipSubscription.create({
    customerInfo: payload.customerInfo,
    planId: plan._id,
    planName: plan.name,
    planType: 'short-term',
    price: plan.price,
    startDate,
    expiryDate,
    hoursLeft: plan.hoursIncluded,
    hoursUsed: 0,
    paymentMethod: payload.paymentMethod,
  });

  return subscription;
};

const renewSubscription = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid subscription ID');

  const subscription = await MembershipSubscription.findById(id);
  if (!subscription) throw new AppError(404, 'Subscription not found');

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let expiryDate: Date;
  let hoursToReset: number;

  if (subscription.planType === 'membership') {
    const plan = await MembershipPlan.findById(subscription.planId);
    if (!plan) throw new AppError(404, 'Original plan not found');
    hoursToReset = plan.hoursPerMonth;
    expiryDate = new Date(today);
    expiryDate.setUTCMonth(expiryDate.getUTCMonth() + 1);
  } else {
    const plan = await ShortTermPlan.findById(subscription.planId);
    if (!plan) throw new AppError(404, 'Original plan not found');
    hoursToReset = plan.hoursIncluded;
    expiryDate = new Date(today.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
  }

  subscription.startDate = today;
  subscription.expiryDate = expiryDate;
  subscription.hoursLeft = hoursToReset;
  subscription.hoursUsed = 0;
  await subscription.save();

  const sub = subscription.toObject();
  return { ...sub, status: computeStatus(sub.expiryDate) };
};

// ─── My Membership (for authenticated user) ─────────────────────────────────

const getMyMembership = async (userId: string) => {
  const { User } = await import('../user/user.models');
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Find all subscriptions for this user (by customerId or phone)
  const filter: any = {
    $or: [] as any[],
  };

  filter.$or.push({ 'customerInfo.customerId': user._id });
  if (user.phone) {
    filter.$or.push({ 'customerInfo.phone': user.phone });
  }

  const subscriptions = await MembershipSubscription.find(filter)
    .sort({ expiryDate: -1 })
    .lean();

  if (!subscriptions.length) {
    return null;
  }

  return subscriptions.map((sub) => ({
    _id: sub._id,
    planName: sub.planName,
    planType: sub.planType,
    price: sub.price,
    startDate: sub.startDate,
    expiryDate: sub.expiryDate,
    hoursLeft: sub.hoursLeft,
    hoursUsed: sub.hoursUsed,
    totalHours: sub.hoursLeft + sub.hoursUsed,
    status: computeStatus(sub.expiryDate),
    paymentMethod: sub.paymentMethod,
    createdAt: sub.createdAt,
  }));
};

// ─── Called from booking service ─────────────────────────────────────────────

export const decrementMemberHours = async (phone: string, duration: number): Promise<void> => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const subscription = await MembershipSubscription.findOne({
    'customerInfo.phone': phone,
    expiryDate: { $gte: today },
    hoursLeft: { $gt: 0 },
  }).sort({ expiryDate: 1 });

  if (!subscription) return;

  subscription.hoursLeft = Math.max(0, subscription.hoursLeft - duration);
  subscription.hoursUsed = subscription.hoursUsed + duration;
  await subscription.save();
};

export const membershipService = {
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
