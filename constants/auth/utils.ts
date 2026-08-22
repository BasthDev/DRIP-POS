import { DEFAULT_ROLE_PERMISSIONS } from './permissions';
import { PermissionKey, PermissionSection, UserRole, UserWithRole } from './types';

/**
 * Check if a user has a specific permission
 */
export const hasPermission = (
  user: UserWithRole | null,
  permissionKey: PermissionKey
): boolean => {
  if (!user) return false;
  
  // Normalize role to proper case (owner -> Owner)
  const normalizedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() as UserRole;
  
  // Use custom permissions if provided, otherwise use default role permissions
  const rolePermissions = DEFAULT_ROLE_PERMISSIONS[normalizedRole];
  if (!rolePermissions) return false;
  
  const permissions = user.permissions || rolePermissions.permissions;
  
  return permissions[permissionKey] || false;
};

/**
 * Check if a user can access a specific section
 */
export const canAccessSection = (
  user: UserWithRole | null,
  section: PermissionSection
): boolean => {
  if (!user) return false;
  
  // Normalize role to proper case (owner -> Owner)
  const normalizedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() as UserRole;
  
  // Use custom permissions if provided, otherwise use default role permissions
  const rolePermissions = DEFAULT_ROLE_PERMISSIONS[normalizedRole];
  if (!rolePermissions) return false;
  
  const canAccess = user.permissions 
    ? checkSectionAccess(user.permissions, section)
    : rolePermissions.canAccessSection[section];
  
  return canAccess || false;
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (
  user: UserWithRole | null,
  permissionKeys: PermissionKey[]
): boolean => {
  if (!user) return false;
  
  return permissionKeys.some(key => hasPermission(user, key));
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = (
  user: UserWithRole | null,
  permissionKeys: PermissionKey[]
): boolean => {
  if (!user) return false;
  
  return permissionKeys.every(key => hasPermission(user, key));
};

/**
 * Check if user has a specific role
 */
export const hasRole = (
  user: UserWithRole | null,
  role: UserRole
): boolean => {
  if (!user) return false;
  return user.role === role;
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (
  user: UserWithRole | null,
  roles: UserRole[]
): boolean => {
  if (!user) return false;
  return roles.includes(user.role);
};

/**
 * Get all permissions for a user
 */
export const getUserPermissions = (
  user: UserWithRole | null
): Partial<Record<PermissionKey, boolean>> => {
  if (!user) return {};
  
  // Normalize role to proper case (owner -> Owner)
  const normalizedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() as UserRole;
  const rolePermissions = DEFAULT_ROLE_PERMISSIONS[normalizedRole];
  if (!rolePermissions) return {};
  
  return user.permissions || rolePermissions.permissions;
};

/**
 * Check section access from custom permissions
 */
const checkSectionAccess = (
  permissions: Partial<Record<PermissionKey, boolean>>,
  section: PermissionSection
): boolean => {
  // Check if user has at least view permission for the section
  const viewPermission = `${section}.view` as PermissionKey;
  return permissions[viewPermission] || false;
};

/**
 * Update user permissions (for admin functions)
 */
export const updateUserPermissions = (
  user: UserWithRole,
  updates: Partial<Record<PermissionKey, boolean>>
): UserWithRole => {
  const currentPermissions = user.permissions || DEFAULT_ROLE_PERMISSIONS[user.role].permissions;
  
  return {
    ...user,
    permissions: {
      ...currentPermissions,
      ...updates,
    } as Partial<Record<PermissionKey, boolean>>,
  };
};

/**
 * Reset user permissions to default for their role
 */
export const resetUserPermissions = (user: UserWithRole): UserWithRole => {
  return {
    ...user,
    permissions: undefined, // Will use default role permissions
  };
};

/**
 * Get permission level for analytics/tracking
 */
export const getPermissionLevel = (user: UserWithRole | null): 'full' | 'partial' | 'limited' | 'none' => {
  if (!user) return 'none';
  
  // Normalize role to proper case (owner -> Owner)
  const normalizedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() as UserRole;
  
  if (normalizedRole === 'Owner') return 'full';
  if (normalizedRole === 'Manager' || normalizedRole === 'Admin') return 'partial';
  if (normalizedRole === 'Staff' || normalizedRole === 'Cashier') return 'limited';
  
  return 'none';
};