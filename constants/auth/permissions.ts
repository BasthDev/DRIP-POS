import { PermissionConfig, PermissionKey, RolePermissions, UserRole } from './types';

export const PERMISSION_DEFINITIONS: PermissionConfig[] = [
  // Dashboard
  { section: 'dashboard', action: 'view', description: 'View dashboard', category: 'basic' },
  
  // Menu
  { section: 'menu', action: 'view', description: 'View menu items', category: 'basic' },
  { section: 'menu', action: 'create', description: 'Create menu items', category: 'advanced' },
  { section: 'menu', action: 'edit', description: 'Edit menu items', category: 'advanced' },
  { section: 'menu', action: 'delete', description: 'Delete menu items', category: 'sensitive' },
  
  // Orders
  { section: 'orders', action: 'view', description: 'View orders', category: 'basic' },
  { section: 'orders', action: 'create', description: 'Create orders', category: 'basic' },
  { section: 'orders', action: 'edit', description: 'Edit orders', category: 'advanced' },
  { section: 'orders', action: 'delete', description: 'Delete orders', category: 'sensitive' },
  { section: 'orders', action: 'approve', description: 'Approve orders', category: 'advanced' },
  { section: 'orders', action: 'export', description: 'Export orders', category: 'advanced' },
  
  // Inventory
  { section: 'inventory', action: 'view', description: 'View inventory', category: 'basic' },
  { section: 'inventory', action: 'create', description: 'Add inventory items', category: 'advanced' },
  { section: 'inventory', action: 'edit', description: 'Edit inventory items', category: 'advanced' },
  { section: 'inventory', action: 'delete', description: 'Delete inventory items', category: 'sensitive' },
  { section: 'inventory', action: 'manage', description: 'Manage stock levels', category: 'advanced' },
  
  // Customers
  { section: 'customers', action: 'view', description: 'View customers', category: 'basic' },
  { section: 'customers', action: 'create', description: 'Create customer profiles', category: 'basic' },
  { section: 'customers', action: 'edit', description: 'Edit customer profiles', category: 'advanced' },
  { section: 'customers', action: 'delete', description: 'Delete customer profiles', category: 'sensitive' },
  
  // Reports
  { section: 'reports', action: 'view', description: 'View reports', category: 'basic' },
  { section: 'reports', action: 'export', description: 'Export reports', category: 'advanced' },
  
  // Settings
  { section: 'settings', action: 'view', description: 'View settings', category: 'basic' },
  { section: 'settings', action: 'edit', description: 'Edit settings', category: 'advanced' },
  { section: 'settings', action: 'manage', description: 'Manage settings', category: 'sensitive' },
  
  // Users
  { section: 'users', action: 'view', description: 'View users', category: 'basic' },
  { section: 'users', action: 'create', description: 'Create users', category: 'sensitive' },
  { section: 'users', action: 'edit', description: 'Edit users', category: 'sensitive' },
  { section: 'users', action: 'delete', description: 'Delete users', category: 'sensitive' },
  { section: 'users', action: 'manage', description: 'Manage user permissions', category: 'sensitive' },
  
  // POS
  { section: 'pos', action: 'view', description: 'Access POS terminal', category: 'basic' },
  { section: 'pos', action: 'create', description: 'Create transactions', category: 'basic' },
  { section: 'pos', action: 'edit', description: 'Edit transactions', category: 'advanced' },
  { section: 'pos', action: 'delete', description: 'Delete transactions', category: 'sensitive' },
  { section: 'pos', action: 'approve', description: 'Approve refunds', category: 'advanced' },
];

// Default permissions for each role
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  Owner: {
    role: 'Owner',
    permissions: PERMISSION_DEFINITIONS.reduce((acc, perm) => {
      acc[`${perm.section}.${perm.action}` as PermissionKey] = true;
      return acc;
    }, {} as Partial<Record<PermissionKey, boolean>>),
    canAccessSection: {
      dashboard: true,
      menu: true,
      orders: true,
      inventory: true,
      customers: true,
      reports: true,
      settings: true,
      users: true,
      pos: true,
    },
  },
  
  Manager: {
    role: 'Manager',
    permissions: PERMISSION_DEFINITIONS.reduce((acc, perm) => {
      // Managers can do everything except manage users and sensitive settings
      const isSensitive = perm.category === 'sensitive' && 
        (perm.section === 'users' || perm.section === 'settings');
      acc[`${perm.section}.${perm.action}` as PermissionKey] = !isSensitive;
      return acc;
    }, {} as Record<PermissionKey, boolean>),
    canAccessSection: {
      dashboard: true,
      menu: true,
      orders: true,
      inventory: true,
      customers: true,
      reports: true,
      settings: true,
      users: false,
      pos: true,
    },
  },
  
  Admin: {
    role: 'Admin',
    permissions: PERMISSION_DEFINITIONS.reduce((acc, perm) => {
      // Admins can manage users and basic operations
      const isRestricted = perm.category === 'sensitive' && 
        (perm.section === 'settings' && perm.action === 'manage');
      acc[`${perm.section}.${perm.action}` as PermissionKey] = !isRestricted;
      return acc;
    }, {} as Record<PermissionKey, boolean>),
    canAccessSection: {
      dashboard: true,
      menu: true,
      orders: true,
      inventory: true,
      customers: true,
      reports: true,
      settings: true,
      users: true,
      pos: true,
    },
  },
  
  Staff: {
    role: 'Staff',
    permissions: PERMISSION_DEFINITIONS.reduce((acc, perm) => {
      // Staff can only do basic operations
      const isAllowed = perm.category === 'basic' || 
        (perm.section === 'orders' && perm.action === 'create') ||
        (perm.section === 'pos' && perm.action === 'create');
      acc[`${perm.section}.${perm.action}` as PermissionKey] = isAllowed;
      return acc;
    }, {} as Record<PermissionKey, boolean>),
    canAccessSection: {
      dashboard: true,
      menu: true,
      orders: true,
      inventory: false,
      customers: true,
      reports: false,
      settings: false,
      users: false,
      pos: true,
    },
  },
  
  Cashier: {
    role: 'Cashier',
    permissions: PERMISSION_DEFINITIONS.reduce((acc, perm) => {
      // Cashiers focused on POS operations only
      const isAllowed = 
        (perm.section === 'pos' && (perm.action === 'view' || perm.action === 'create')) ||
        (perm.section === 'orders' && perm.action === 'create') ||
        (perm.section === 'dashboard' && perm.action === 'view');
      acc[`${perm.section}.${perm.action}` as PermissionKey] = isAllowed;
      return acc;
    }, {} as Record<PermissionKey, boolean>),
    canAccessSection: {
      dashboard: true,
      menu: false,
      orders: true,
      inventory: false,
      customers: false,
      reports: false,
      settings: false,
      users: false,
      pos: true,
    },
  },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  Owner: 'Owner',
  Manager: 'Manager', 
  Admin: 'Admin',
  Staff: 'Staff',
  Cashier: 'Cashier',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  Owner: 'Full access to all features and settings',
  Manager: 'Can manage most operations except user management',
  Admin: 'Can manage users and basic operations',
  Staff: 'Basic access for daily operations',
  Cashier: 'POS-focused access for transactions',
};