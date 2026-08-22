import {
  BarChart3,
  Boxes,
  Building2,
  Layers,
  Leaf,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  Store,
  Users,
  Utensils
} from 'lucide-react-native';
import { UserRole } from './auth/types';

export interface MenuItem {
  title: string;
  path: string;
  icon: any; // Lucide icon reference
  roles: UserRole[]; // Allowed roles
}

export const DRAWER_MENU_ITEMS: MenuItem[] = [
  {
    title: 'Dashboard & POS',
    path: '/',
    icon: ShoppingBag,
    roles: ['Owner', 'Manager', 'Admin', 'Staff', 'Cashier'],
  },
  {
    title: 'Suppliers',
    path: '/suppliers',
    icon: Building2,
    roles: ['Owner', 'Manager', 'Admin'],
  },
  {
    title: 'Warehouse & Stock',
    path: '/inventory',
    icon: Boxes,
    roles: ['Owner', 'Manager', 'Admin'],
  },
  /* 
  // Commented out future menu items (preserved for reference):
  {
    title: 'Orders & Sales',
    path: '/orders',
    icon: Receipt,
    roles: ['Owner', 'Manager', 'Admin', 'Staff', 'Cashier'],
  },
  {
    title: 'Analytics & Reports',
    path: '/reports',
    icon: BarChart3,
    roles: ['Owner', 'Manager', 'Admin'],
  },
  {
    title: 'Store Branches',
    path: '/stores',
    icon: Store,
    roles: ['Owner', 'Admin'],
  },
  {
    title: 'Staff Management',
    path: '/staff',
    icon: Users,
    roles: ['Owner', 'Admin'],
  },
  {
    title: 'Products',
    path: '/products',
    icon: Package,
    roles: ['Owner', 'Manager', 'Admin'],
  },
  {
    title: 'Categories',
    path: '/categories',
    icon: Layers,
    roles: ['Owner', 'Manager', 'Admin'],
  },
  {
    title: 'Ingredients',
    path: '/ingredients',
    icon: Leaf,
    roles: ['Owner', 'Manager', 'Admin'],
  },
  {
    title: 'Recipes & HPP',
    path: '/recipes',
    icon: Utensils,
    roles: ['Owner', 'Manager', 'Admin'],
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: Settings,
    roles: ['Owner', 'Manager', 'Admin', 'Staff', 'Cashier'],
  },
  */
];