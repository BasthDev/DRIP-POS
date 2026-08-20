import {
  BarChart3,
  Package,
  Settings,
  ShoppingBag,
  Users
} from 'lucide-react-native';

export interface MenuItem {
  title: string;
  path: string;
  icon: any; // Lucide icon reference
  roles: ('cashier' | 'manager' | 'admin')[]; // Allowed roles
}

export const DRAWER_MENU_ITEMS: MenuItem[] = [
  {
    title: 'Home',
    path: '/',
    icon: ShoppingBag,
    roles: ['cashier', 'manager', 'admin'],
  },
  {
    title: 'UI Examples',
    path: '/example',
    icon: Package,
    roles: ['manager', 'admin'],
  },
  {
    title: 'Analytics & Reports',
    path: '/reports',
    icon: BarChart3,
    roles: ['manager', 'admin'],
  },
  {
    title: 'Staff Management',
    path: '/staff',
    icon: Users,
    roles: ['admin'],
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: Settings,
    roles: ['cashier', 'manager', 'admin'],
  },
];