export interface ValidationResult<T = any> {
  isValid: boolean;
  errors: string[];
  data?: T;
}

export const AuthValidator = {
  validateSignUp(data: {
    email?: string;
    password?: string;
    fullName?: string;
    businessName?: string;
  }): ValidationResult {
    const errors: string[] = [];

    if (!data.fullName?.trim()) {
      errors.push('Full Name is required.');
    }

    if (!data.businessName?.trim()) {
      errors.push('Business Name is required.');
    }

    if (!data.email?.trim()) {
      errors.push('Email address is required.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      errors.push('Invalid email address format.');
    }

    if (!data.password) {
      errors.push('Password is required.');
    } else if (data.password.length < 6) {
      errors.push('Password must be at least 6 characters long.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined,
    };
  },

  validateSignIn(data: { email?: string; password?: string }): ValidationResult {
    const errors: string[] = [];

    if (!data.email?.trim()) {
      errors.push('Email address is required.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      errors.push('Invalid email address format.');
    }

    if (!data.password) {
      errors.push('Password is required.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined,
    };
  },

  validateOtp(email?: string, token?: string): ValidationResult {
    const errors: string[] = [];

    if (!email?.trim()) {
      errors.push('Email address is missing.');
    }

    if (!token?.trim()) {
      errors.push('OTP code is required.');
    } else if (token.trim().length !== 6) {
      errors.push('OTP code must be 6 digits.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};
