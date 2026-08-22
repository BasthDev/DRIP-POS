export type {
  UserRole,
  PermissionSection,
  PermissionAction,
  PermissionKey,
  RolePermissions,
  UserWithRole,
  PermissionConfig,
} from './types';

export {
  PERMISSION_DEFINITIONS,
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
} from './permissions';

export {
  hasPermission,
  canAccessSection,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  getUserPermissions,
  updateUserPermissions,
  resetUserPermissions,
  getPermissionLevel,
} from './utils';

export {
  AuthProvider,
  useAuth,
  withPermission,
  withSectionAccess,
  withRole,
} from './context';