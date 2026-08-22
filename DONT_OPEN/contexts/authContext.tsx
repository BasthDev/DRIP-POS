import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthController } from '@/controllers/authController';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  register: (email: string, password: string, fullName: string, businessName: string) => Promise<{ error: any }>;
  login: (email: string, password: string) => Promise<{ error: any }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const register = async (email: string, password: string, fullName: string, businessName: string) => {
    const res = await AuthController.register({ email, password, fullName, businessName });
    return { error: res.error };
  };

  const login = async (email: string, password: string) => {
    const res = await AuthController.login({ email, password });
    return { error: res.error };
  };

  const verifyOtp = async (email: string, token: string) => {
    const res = await AuthController.verifyOtp(email, token);
    return { error: res.error };
  };

  const signOut = async () => {
    await AuthController.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        register,
        login,
        verifyOtp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
