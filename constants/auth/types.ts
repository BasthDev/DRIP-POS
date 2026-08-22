export type UserRole = 'Owner' | 'Manager' | 'Admin' | 'Staff' | 'Cashier';

export type PermissionSection = 
  | 'dashboard'
  | 'menu'
  | 'orders'
  | 'inventory'
  | 'customers'
  | 'reports'
  | 'settings'
  | 'users'
  | 'pos';

export type PermissionAction = 
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'export'
  | 'manage';

export type PermissionKey = `${PermissionSection}.${PermissionAction}`;

export interface RolePermissions {
  role: UserRole;
  permissions: Partial<Record<PermissionKey, boolean>>;
  canAccessSection: Record<PermissionSection, boolean>;
}

export interface UserWithRole {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions?: Partial<Record<PermissionKey, boolean>>;
  storeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionConfig {
  section: PermissionSection;
  action: PermissionAction;
  description: string;
  category: 'basic' | 'advanced' | 'sensitive';
}