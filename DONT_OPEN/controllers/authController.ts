import { supabase } from '@/lib/supabase';
import { AuthValidator } from '@/validators/authValidator';

export const AuthController = {
  async register(params: {
    email: string;
    password: string;
    fullName: string;
    businessName: string;
  }) {
    const validation = AuthValidator.validateSignUp(params);
    if (!validation.isValid) {
      return { data: null, error: new Error(validation.errors.join('\n')) };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: params.email.trim(),
        password: params.password,
        options: {
          data: {
            full_name: params.fullName.trim(),
            business_name: params.businessName.trim(),
          },
        },
      });

      if (error) return { data: null, error };

      if (data.user) {
        // Run database onboarding trigger/procedure
        await supabase.rpc('handle_new_user_onboarding', {
          p_user_id: data.user.id,
          p_full_name: params.fullName.trim(),
          p_business_name: params.businessName.trim(),
        });
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  async login(params: { email: string; password: string }) {
    const validation = AuthValidator.validateSignIn(params);
    if (!validation.isValid) {
      return { data: null, error: new Error(validation.errors.join('\n')) };
    }

    try {
      const res = await supabase.auth.signInWithPassword({
        email: params.email.trim(),
        password: params.password,
      });
      return res;
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  async verifyOtp(email: string, token: string) {
    const validation = AuthValidator.validateOtp(email, token);
    if (!validation.isValid) {
      return { data: null, error: new Error(validation.errors.join('\n')) };
    }

    try {
      const res = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'signup',
      });
      return res;
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  async signOut() {
    return await supabase.auth.signOut();
  },
};
