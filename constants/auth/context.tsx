import { supabase } from '@/DONT_OPEN/lib/supabase';
import { Session } from '@supabase/supabase-js';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { PermissionKey, PermissionSection, UserRole, UserWithRole } from './types';
import {
  canAccessSection,
  getPermissionLevel,
  getUserPermissions,
  hasAllPermissions,
  hasAnyPermission,
  hasAnyRole,
  hasPermission,
  hasRole,
} from './utils';

interface AuthContextType {
  user: UserWithRole | null;
  session: Session | null;
  loading: boolean;
  setUser: (user: UserWithRole | null) => void;
  login: (email: string, password: string) => Promise<{ error: any }>;
  register: (email: string, password: string, fullName: string, businessName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasPermission: (permissionKey: PermissionKey) => boolean;
  canAccessSection: (section: PermissionSection) => boolean;
  hasAnyPermission: (permissionKeys: PermissionKey[]) => boolean;
  hasAllPermissions: (permissionKeys: PermissionKey[]) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  getUserPermissions: () => Partial<Record<PermissionKey, boolean>>;
  getPermissionLevel: () => 'full' | 'partial' | 'limited' | 'none';
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: UserWithRole | null;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children, 
  initialUser = null 
}) => {
  const [user, setUser] = useState<UserWithRole | null>(initialUser);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only initialize Supabase if it's available
    if (!supabase) {
      setLoading(false);
      return;
    }

    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session: s } }: { data: { session: any } }) => {
      setSession(s);
      if (s?.user) {
        // Normalize role to proper case (owner -> Owner)
        const rawRole = s.user.user_metadata?.role || 'Staff';
        const normalizedRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase() as UserRole;
        
        // Convert Supabase user to UserWithRole
        const userWithRole: UserWithRole = {
          id: s.user.id,
          email: s.user.email || '',
          name: s.user.user_metadata?.fullName || s.user.email?.split('@')[0] || 'User',
          role: normalizedRole,
          storeId: s.user.user_metadata?.storeId,
          createdAt: s.user.created_at || '',
          updatedAt: s.user.updated_at || '',
        };
        setUser(userWithRole);
      }
      setLoading(false);
    });

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: any, s: any) => {
        setSession(s);
        if (s?.user) {
          // Normalize role to proper case (owner -> Owner)
          const rawRole = s.user.user_metadata?.role || 'Staff';
          const normalizedRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase() as UserRole;
          
          const userWithRole: UserWithRole = {
            id: s.user.id,
            email: s.user.email || '',
            name: s.user.user_metadata?.fullName || s.user.email?.split('@')[0] || 'User',
            role: normalizedRole,
            storeId: s.user.user_metadata?.storeId,
            createdAt: s.user.created_at || '',
            updatedAt: s.user.updated_at || '',
          };
          setUser(userWithRole);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const register = async (email: string, password: string, fullName: string, businessName: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            fullName,
            businessName,
            role: 'owner', // Default role for new users (lowercase to match UserRole type)
          },
        },
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    if (!supabase) {
      setUser(null);
      setSession(null);
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const contextValue: AuthContextType = {
    user,
    session,
    loading,
    setUser,
    login,
    register,
    signOut,
    hasPermission: (permissionKey: PermissionKey) => hasPermission(user, permissionKey),
    canAccessSection: (section: PermissionSection) => canAccessSection(user, section),
    hasAnyPermission: (permissionKeys: PermissionKey[]) => hasAnyPermission(user, permissionKeys),
    hasAllPermissions: (permissionKeys: PermissionKey[]) => hasAllPermissions(user, permissionKeys),
    hasRole: (role: UserRole) => hasRole(user, role),
    hasAnyRole: (roles: UserRole[]) => hasAnyRole(user, roles),
    getUserPermissions: () => getUserPermissions(user),
    getPermissionLevel: () => getPermissionLevel(user),
    isAuthenticated: user !== null,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Higher-order component to protect routes/sections based on permissions
 */
export const withPermission = (
  Component: React.ComponentType<any>,
  requiredPermission: PermissionKey
) => {
  return function PermissionGuard(props: any) {
    const { hasPermission } = useAuth();
    
    if (!hasPermission(requiredPermission)) {
      return null; // Or redirect to unauthorized page
    }
    
    return <Component {...props} />;
  };
};

/**
 * Higher-order component to protect routes/sections based on section access
 */
export const withSectionAccess = (
  Component: React.ComponentType<any>,
  requiredSection: PermissionSection
) => {
  return function SectionAccessGuard(props: any) {
    const { canAccessSection } = useAuth();
    
    if (!canAccessSection(requiredSection)) {
      return null; // Or redirect to unauthorized page
    }
    
    return <Component {...props} />;
  };
};

/**
 * Higher-order component to protect routes/sections based on role
 */
export const withRole = (
  Component: React.ComponentType<any>,
  requiredRole: UserRole
) => {
  return function RoleGuard(props: any) {
    const { hasRole } = useAuth();
    
    if (!hasRole(requiredRole)) {
      return null; // Or redirect to unauthorized page
    }
    
    return <Component {...props} />;
  };
};