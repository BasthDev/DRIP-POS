import { ValidationResult } from './authValidator';

export const InventoryValidator = {
  validateStockIntake(data: {
    batch_number?: string;
    quantity?: number;
    unit_cost?: number;
    target_id?: string;
  }): ValidationResult {
    const errors: string[] = [];

    if (!data.target_id) {
      errors.push('Please select a product or ingredient to receive.');
    }

    if (!data.batch_number?.trim()) {
      errors.push('Batch number is required for inventory tracking.');
    }

    if (data.quantity == null || isNaN(data.quantity) || data.quantity <= 0) {
      errors.push('Intake quantity must be greater than 0.');
    }

    if (data.unit_cost == null || isNaN(data.unit_cost) || data.unit_cost < 0) {
      errors.push('Unit purchase cost cannot be negative.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined,
    };
  },
};
