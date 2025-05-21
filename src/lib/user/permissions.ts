import type { UserRole } from '@/lib/user/type';

export const canCreateUsers = (userRole: UserRole): boolean => {
  return userRole === 'SUPER_ADMIN';
};
export const canUpdateUsers = (userRole: UserRole): boolean => {
  return userRole === 'SUPER_ADMIN';
};
export const canDeleteUsers = (userRole: UserRole): boolean => {
  return userRole === 'SUPER_ADMIN';
};

export const canViewContributions = (userRole: UserRole): boolean => {
  return userRole !== 'ATTENDANCE_ADMIN';
};

export const canViewAttendance = (userRole: UserRole): boolean => {
  return userRole !== 'FINANCE_ADMIN';
};
