import { ValidationResult } from './authValidator';

export const CategoryValidator = {
  validateCategory(data: {
    name?: string;
    description?: string;
    color?: string;
  }): ValidationResult {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push('Category name is required.');
    } else if (data.name.trim().length > 50) {
      errors.push('Category name cannot exceed 50 characters.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined,
    };
  },
};
