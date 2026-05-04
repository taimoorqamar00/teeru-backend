import { MembershipPlan, ShortTermPlan } from '../modules/membership/membership.model';

const seedMembershipPlans = async (): Promise<void> => {
  const [planCount, shortTermCount] = await Promise.all([
    MembershipPlan.countDocuments(),
    ShortTermPlan.countDocuments(),
  ]);

  if (planCount === 0) {
    await MembershipPlan.insertMany([
      {
        name: 'Bronze',
        price: 40000,
        period: 'monthly',
        hoursPerMonth: 4,
        features: ['4 hours per month', '10% booking discount', 'No rollover'],
        isActive: true,
      },
      {
        name: 'Silver',
        price: 75000,
        period: 'monthly',
        hoursPerMonth: 8,
        features: ['8 hours per month', '15% booking discount', '2 hour rollover'],
        isActive: true,
      },
      {
        name: 'Gold',
        price: 120000,
        period: 'monthly',
        hoursPerMonth: 16,
        features: [
          '16 hours per month',
          '20% booking discount',
          'Unlimited rollover',
          'Priority booking',
        ],
        isActive: true,
      },
    ]);
  }

  if (shortTermCount === 0) {
    await ShortTermPlan.insertMany([
      {
        name: '1-Week Pass',
        price: 20000,
        durationDays: 7,
        hoursIncluded: 2,
        isActive: true,
      },
      {
        name: '2-Week Pass',
        price: 35000,
        durationDays: 14,
        hoursIncluded: 4,
        isActive: true,
      },
    ]);
  }
};

export default seedMembershipPlans;
