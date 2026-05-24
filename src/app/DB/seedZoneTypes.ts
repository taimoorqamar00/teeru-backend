import ZoneType from '../modules/zoneType/zoneType.model';

const defaultZoneTypes = [
  {
    name: 'Tribune',
    slug: 'tribune',
    description: 'Standard seating area',
    isDefault: true,
  },
  {
    name: 'Annexe Loge',
    slug: 'annexe-loge',
    description: 'Annex box seating',
    isDefault: true,
  },
  {
    name: 'Loge VIP',
    slug: 'loge-vip',
    description: 'VIP box seating',
    isDefault: true,
  },
  {
    name: 'Loge VVIP',
    slug: 'loge-vvip',
    description: 'VVIP box seating',
    isDefault: true,
  },
];

export const seedZoneTypes = async () => {
  for (const zone of defaultZoneTypes) {
    const exists = await ZoneType.findOne({ slug: zone.slug });
    if (!exists) {
      await ZoneType.create(zone);
    }
  }
  console.log('Default zone types seeded');
};
