import type { User } from '@/lib/user/type';
import { UserCategory, UserRole } from '@/lib/user/type';
import type { Communique } from '@/types/communique.types';

export interface CommuniquePermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  canManageOthers: boolean;
}

/**
 * Check if user has access to communiques management
 */
export const hasCommuniquesAccess = (user: User | null): boolean => {
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
export const getCommuniquePermissions = (
  user: User | null,
): CommuniquePermissions => {
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
      canManageOthers: false, // Can only manage their own communiques
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
      canManageOthers: false, // Can only manage their own communiques
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
 * Check if user can edit a specific communique
 */
export const canEditCommunique = (
  user: User | null,
  communique: Communique,
): boolean => {
  if (!user) return false;

  const permissions = getCommuniquePermissions(user);

  // SUPER_ADMIN can edit any communique
  if (permissions.canManageOthers) return true;

  // Others can only edit their own communiques
  return permissions.canUpdate && communique.createdById === user.id;
};

/**
 * Check if user can delete a specific communique
 */
export const canDeleteCommunique = (
  user: User | null,
  communique: Communique,
): boolean => {
  if (!user) return false;

  const permissions = getCommuniquePermissions(user);

  // SUPER_ADMIN can delete any communique
  if (permissions.canManageOthers) return true;

  // Other admins can only delete their own communiques
  if (permissions.canDelete && !permissions.canManageOthers) {
    return communique.createdById === user.id;
  }

  return false;
};

/**
 * Check if user can manage a specific communique (edit or delete)
 */
export const canManageCommunique = (
  user: User | null,
  communique: Communique,
): boolean => {
  if (!user) return false;

  const permissions = getCommuniquePermissions(user);

  // SUPER_ADMIN can manage any communique
  if (permissions.canManageOthers) return true;

  // Others can only manage their own communiques
  return communique.createdById === user.id;
};
