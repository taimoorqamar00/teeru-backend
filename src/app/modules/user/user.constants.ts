export const USER_ROLE = {
  ADMIN: 'admin',
  STAFF: 'staff',
  SEEKER: 'seeker',
  PLUSONE: 'plusone',
} as const;

export const PERMISSIONS = [
  'view_bookings',
  'manage_checkins',
  'manage_bays',
  'view_finance',
] as const;

export type TPermission = (typeof PERMISSIONS)[number];

export const gender = ['Male', 'Female', 'Others'] as const;
export const Role = Object.values(USER_ROLE);
