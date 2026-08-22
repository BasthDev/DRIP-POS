import {
  Boxes,
  Building2,
  FolderTree,
  Layers,
  Leaf,
  Package,
  ShoppingBag,
  Utensils
} from 'lucide-react-native';
import { UserRole } from './auth/types';

export interface MenuItem {
  title: string;
  path: string;
  icon: any;
  roles: UserRole[];
}

export const DRAWER_MENU_ITEMS: MenuItem[] = [
  {
    title: 'POS Terminal',
    path: '/',
    icon: ShoppingBag,
    roles: ['Owner', 'Manager', 'Admin', 'Staff', 'Cashier'],
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
    title: 'Category Groups',
    path: '/category-groups',
    icon: FolderTree,
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
];