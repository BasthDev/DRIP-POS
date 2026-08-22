import { ValidationResult } from './authValidator';

export interface RecipeItemInput {
  ingredient_id: string;
  quantity: number;
  unit_id: string;
  wastage_percent?: number;
}

export const RecipeValidator = {
  validateRecipe(data: {
    name?: string;
    items?: RecipeItemInput[];
  }): ValidationResult {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push('Recipe name is required.');
    }

    if (!data.items || data.items.length === 0) {
      errors.push('At least one ingredient must be added to the recipe.');
    } else {
      data.items.forEach((item, index) => {
        if (!item.ingredient_id) {
          errors.push(`Item #${index + 1}: Ingredient selection is missing.`);
        }
        if (item.quantity == null || isNaN(item.quantity) || item.quantity <= 0) {
          errors.push(`Item #${index + 1}: Portion quantity must be greater than 0.`);
        }
        if (item.wastage_percent != null && (item.wastage_percent < 0 || item.wastage_percent > 100)) {
          errors.push(`Item #${index + 1}: Wastage percentage must be between 0% and 100%.`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined,
    };
  },
};
