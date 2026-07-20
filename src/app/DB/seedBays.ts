import { Bay } from '../modules/bay/bay.model';

const seedBays = async (): Promise<void> => {
  const count = await Bay.countDocuments({ isDeleted: { $ne: true } });

  if (count === 0) {
    await Bay.insertMany([
      {
        name: 'Bay 1',
        number: 1,
        hardware: 'Standard Setup',
        projector: 'Standard Projector',
        isActive: true,
        isDeleted: false,
      },
      {
        name: 'Bay 2',
        number: 2,
        hardware: 'Standard Setup',
        projector: 'Standard Projector',
        isActive: true,
        isDeleted: false,
      },
      {
        name: 'Bay 3',
        number: 3,
        hardware: 'Standard Setup',
        projector: 'Standard Projector',
        isActive: true,
        isDeleted: false,
      },
      {
        name: 'Bay 4',
        number: 4,
        hardware: 'Standard Setup',
        projector: 'Standard Projector',
        isActive: true,
        isDeleted: false,
      },
    ]);
    console.log('[Seed] 4 default bays created');
  }
};

export default seedBays;
