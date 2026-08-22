import { ValidationResult } from './authValidator';

export type CostCalculationMode = 'per_gram_auto' | 'per_gram_manual' | 'per_pcs';

export const IngredientValidator = {
  validateIngredient(data: {
    name?: string;
    base_unit_id?: string;
    cost_type?: CostCalculationMode;
    buy_price?: number;
    item_qty?: number;
    cost_per_gram_manual?: number;
    min_stock?: number;
  }): ValidationResult {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push('Ingredient / Raw Material name is required.');
    }

    if (!data.base_unit_id) {
      errors.push('Measurement unit must be selected.');
    }

    if (data.cost_type === 'per_gram_manual') {
      if (data.cost_per_gram_manual == null || isNaN(data.cost_per_gram_manual) || data.cost_per_gram_manual < 0) {
        errors.push('Cost per gram / ml must be a valid non-negative number.');
      }
    } else if (data.cost_type === 'per_pcs' || data.cost_type === 'per_gram_auto') {
      if (data.buy_price == null || isNaN(data.buy_price) || data.buy_price < 0) {
        errors.push('Purchase price must be a valid non-negative number.');
      }
      if (data.cost_type === 'per_gram_auto' && (data.item_qty == null || isNaN(data.item_qty) || data.item_qty <= 0)) {
        errors.push('Package size quantity must be greater than zero.');
      }
    }

    if (data.min_stock != null && (isNaN(data.min_stock) || data.min_stock < 0)) {
      errors.push('Minimum stock alert threshold cannot be negative.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined,
    };
  },
};
