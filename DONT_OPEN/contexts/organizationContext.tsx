import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './authContext';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  currency: string;
  timezone: string;
  status: string;
}

interface OrganizationState {
  organizations: Organization[];
  activeOrg: Organization | null;
  loading: boolean;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationState | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrganizations = async () => {
    if (!user) {
      setOrganizations([]);
      setActiveOrg(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: memberships } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (memberships && memberships.length > 0) {
        const orgIds = memberships.map((m) => m.organization_id);
        const { data: orgs } = await supabase
          .from('organizations')
          .select('*')
          .in('id', orgIds)
          .eq('status', 'active');

        const orgList = orgs || [];
        setOrganizations(orgList);
        setActiveOrg(orgList[0] || null);
      } else {
        setOrganizations([]);
        setActiveOrg(null);
      }
    } catch {
      setOrganizations([]);
      setActiveOrg(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [user]);

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        activeOrg,
        loading,
        refreshOrganizations: fetchOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};
