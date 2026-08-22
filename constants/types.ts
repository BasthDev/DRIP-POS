// ─────────────────────────────────────────────
// Union types matching POSProject
// ─────────────────────────────────────────────

export type TableStatus = "available" | "occupied";
export type CostType = "per_gram_manual" | "per_gram_auto" | "per_pcs";
export type ItemUnit = "ml" | "l" | "g" | "kg" | "pcs";
export type ValueType = "flat" | "percentage";
export type OrderStatus = "open" | "paid" | "cancelled";
export type PaymentMethod = "cash" | "qris" | "transfer" | "split" | "store_credit" | "loyalty_points";
export type EmployeeRole = "Owner" | "Admin" | "Staff";
export type StockTransactionType = "sale" | "restock" | "adjustment" | "recipe_deduction" | "opname";
export type StockAlertType = "low_stock" | "out_of_stock";
export type StockSource = "self" | "recipe";
export type ShiftStatus = "open" | "closed";
export type VoidRefundType = "void" | "refund";

// ─────────────────────────────────────────────
// Entity interfaces
// ─────────────────────────────────────────────

export interface CategoryParent {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  color: string;
  created_at?: string;
  updated_at?: string;
  parent_name?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Ingredient {
  id: string;
  supplier_id: string | null;
  supplier_name?: string | null;
  name: string;
  cost_type: CostType;
  buy_price: number | null;
  item_qty: number | null;
  item_unit: ItemUnit | null;
  cost_per_gram: number | null;
  current_stock: number;
  min_stock_level: number;
  reorder_quantity: number;
  low_stock_alert: number; // 0 | 1
  last_restocked_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Recipe {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface RecipeIngredient {
  id?: string;
  recipe_id: string;
  ingredient_id: string;
  qty_used: number;
  ingredient_name?: string;
  cost_per_gram?: number | null;
  buy_price?: number | null;
  item_unit?: ItemUnit | null;
  current_stock?: number;
}

export interface RecipeExtra {
  id?: string;
  recipe_id: string;
  extra_name: string;
  value_type: ValueType;
  value: number;
}

export interface RecipeDetail extends Recipe {
  ingredients: RecipeIngredient[];
  extras: RecipeExtra[];
  hpp: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category_id: string | null;
  category_name?: string | null;
  parent_category_name?: string | null;
  buy_price: number | null;
  use_hpp: number; // 0 | 1
  sell_price: number;
  recipe_id: string | null;
  recipe_name?: string | null;
  image_uri?: string | null;
  use_stock: number; // 0 | 1
  stock_quantity: number;
  min_stock_level: number;
  low_stock_alert: number; // 0 | 1
  stock_source: StockSource;
  last_restocked_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StockTransaction {
  id: string;
  item_type: "ingredient" | "product";
  item_id: string;
  item_name?: string;
  item_unit?: string | null;
  transaction_type: StockTransactionType;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  reference_id?: string | null;
  reason?: string | null;
  created_at: string;
}

export interface StockAlert {
  id: string;
  item_type: "ingredient" | "product";
  item_id: string;
  item_name?: string;
  item_unit?: string | null;
  alert_type: StockAlertType;
  current_quantity: number;
  threshold_quantity: number;
  resolved: number;
  resolved_at: string | null;
  created_at: string;
}
