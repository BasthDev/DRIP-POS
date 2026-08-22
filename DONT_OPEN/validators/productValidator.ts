import { ValidationResult } from './authValidator';

export const ProductValidator = {
  validateProduct(data: {
    name?: string;
    selling_price?: number;
    cost_price?: number;
    category_id?: string;
    sku?: string;
    barcode?: string;
    track_stock?: boolean;
    min_stock?: number;
  }): ValidationResult {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push('Product name is required.');
    }

    if (data.selling_price == null || isNaN(data.selling_price) || data.selling_price < 0) {
      errors.push('Selling price must be a valid positive number.');
    }

    if (data.cost_price != null && (isNaN(data.cost_price) || data.cost_price < 0)) {
      errors.push('Cost price cannot be negative.');
    }

    if (data.min_stock != null && (isNaN(data.min_stock) || data.min_stock < 0)) {
      errors.push('Minimum stock threshold cannot be negative.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined,
    };
  },
};
