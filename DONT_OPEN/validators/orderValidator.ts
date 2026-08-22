import { ValidationResult } from './authValidator';

export const OrderValidator = {
  validateCheckout(data: {
    itemsCount: number;
    grandTotal: number;
    paymentMethod: 'cash' | 'qris' | 'card' | 'bank';
    tenderedAmount?: number;
  }): ValidationResult {
    const errors: string[] = [];

    if (data.itemsCount <= 0) {
      errors.push('Cannot process checkout: Cart is empty.');
    }

    if (data.grandTotal < 0) {
      errors.push('Grand Total cannot be negative.');
    }

    if (data.paymentMethod === 'cash') {
      if (data.tenderedAmount == null || isNaN(data.tenderedAmount)) {
        errors.push('Please enter cash tendered amount.');
      } else if (data.tenderedAmount < data.grandTotal) {
        errors.push('Cash tendered amount cannot be less than Grand Total.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined,
    };
  },
};
