import { ValidationResult } from './authValidator';

export const StoreValidator = {
  validateCreateStore(
    data: { name?: string; phone?: string; address?: string },
    currentStoreCount: number,
    maxStoreCapacity: number = 1
  ): ValidationResult {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push('Store Branch Name is required.');
    }

    if (currentStoreCount >= maxStoreCapacity) {
      errors.push(
        `Store branch limit reached (${currentStoreCount}/${maxStoreCapacity}). Free Plan allows 1 store branch. Delete existing store or upgrade plan.`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined,
    };
  },
};
