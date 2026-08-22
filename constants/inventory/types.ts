export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  description: string;
  unit: string;
  unitCost: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  supplierId: string;
  supplierName: string;
  location: string;
  expiryDate: string | null;
  lastRestockDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryFormData {
  name: string;
  sku: string;
  barcode: string;
  category: string;
  description: string;
  unit: string;
  unitCost: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  supplierId: string;
  location: string;
  expiryDate: string | null;
}

export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  itemName: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  unitCost: number;
  totalCost: number;
  reason: string;
  referenceNumber: string;
  performedBy: string;
  performedByName: string;
  previousStock: number;
  newStock: number;
  createdAt: string;
}

export interface InventoryFilter {
  search: string;
  category: string;
  status: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  supplier: string;
  location: string;
  sortBy: 'name' | 'stock' | 'cost' | 'expiry' | 'lastRestock';
  sortOrder: 'asc' | 'desc';
}

export interface StockAlert {
  id: string;
  inventoryItemId: string;
  itemName: string;
  type: 'low-stock' | 'out-of-stock' | 'expiring-soon';
  currentStock: number;
  threshold: number;
  expiryDate: string | null;
  severity: 'info' | 'warning' | 'critical';
  isResolved: boolean;
  createdAt: string;
  resolvedAt: string | null;
}

export type InventoryValidationErrors = Partial<Record<keyof InventoryFormData, string>>;

export const INVENTORY_UNITS = [
  'pieces',
  'kg',
  'grams',
  'liters',
  'ml',
  'boxes',
  'packs',
  'bottles',
  'cans',
  'bags',
] as const;

export const INVENTORY_CATEGORIES = [
  'Beverages',
  'Food',
  'Ingredients',
  'Packaging',
  'Cleaning Supplies',
  'Equipment',
  'Other',
] as const;