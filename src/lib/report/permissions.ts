import type { User } from '@/lib/user/type';
import { UserCategory, UserRole } from '@/lib/user/type';
import type { Report } from '@/types/report.types';

export interface ReportPermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  canManageOthers: boolean;
}

/**
 * Check if user has access to reports module
 */
export const hasReportsAccess = (user: User | null): boolean => {
  if (!user) return false;

  return (
    user.categories?.includes(UserCategory.COMMITTEE) ||
    user.categories?.includes(UserCategory.LEAD) ||
    user.role === UserRole.SUPER_ADMIN ||
    user.role === UserRole.FINANCE_ADMIN ||
    user.role === UserRole.ATTENDANCE_ADMIN
  );
};

/**
 * Get detailed permissions for a user
 */
export const getReportPermissions = (user: User | null): ReportPermissions => {
  if (!user) {
    return {
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      canViewAll: false,
      canManageOthers: false,
    };
  }

  // Admin users: Check by role
  if (user.role === UserRole.SUPER_ADMIN) {
    return {
      canCreate: true,
      canUpdate: true,
      canDelete: true,
      canViewAll: true,
      canManageOthers: true,
    };
  }

  if (
    user.role === UserRole.FINANCE_ADMIN ||
    user.role === UserRole.ATTENDANCE_ADMIN
  ) {
    return {
      canCreate: true,
      canUpdate: true,
      canDelete: true,
      canViewAll: true,
      canManageOthers: false, // Can only manage their own reports
    };
  }

  // Regular users: Check by category
  if (
    user.categories?.includes(UserCategory.LEAD) ||
    user.categories?.includes(UserCategory.COMMITTEE)
  ) {
    return {
      canCreate: true,
      canUpdate: true,
      canDelete: false, // Only SUPER_ADMIN can delete
      canViewAll: true,
      canManageOthers: false, // Can only manage their own reports
    };
  }

  // No access for other users
  return {
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canViewAll: false,
    canManageOthers: false,
  };
};

/**
 * Check if user can edit a specific report
 */
export const canEditReport = (user: User | null, report: Report): boolean => {
  if (!user) return false;

  const permissions = getReportPermissions(user);

  // SUPER_ADMIN can edit any report
  if (permissions.canManageOthers) return true;

  // Others can only edit their own reports
  return permissions.canUpdate && report.createdById === user.id;
};

/**
 * Check if user can delete a specific report
 */
export const canDeleteReport = (user: User | null): boolean => {
  if (!user) return false;

  const permissions = getReportPermissions(user);

  // Only SUPER_ADMIN can delete reports
  return permissions.canDelete;
};

/**
 * Check if user can manage a specific report (edit or delete)
 */
export const canManageReport = (user: User | null, report: Report): boolean => {
  if (!user) return false;

  const permissions = getReportPermissions(user);

  // SUPER_ADMIN can manage any report
  if (permissions.canManageOthers) return true;

  // Others can only manage their own reports
  return report.createdById === user.id;
};
