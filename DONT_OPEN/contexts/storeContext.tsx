import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './authContext';
import { useOrganization } from './organizationContext';
import { StoreController } from '@/controllers/storeController';

export interface Store {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  currency: string;
  timezone: string;
  is_active: boolean;
  status: string;
}

export interface Warehouse {
  id: string;
  organization_id: string;
  store_id: string;
  name: string;
  is_default: boolean;
  status: string;
}

interface StoreState {
  stores: Store[];
  activeStore: Store | null;
  defaultWarehouse: Warehouse | null;
  loading: boolean;
  setActiveStore: (store: Store) => void;
  createStore: (name: string, phone?: string, address?: string) => Promise<{ error: any }>;
  deleteStore: (storeId: string) => Promise<{ error: any }>;
  refreshStores: () => Promise<void>;
}

const StoreContext = createContext<StoreState | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { activeOrg } = useOrganization();
  const [stores, setStores] = useState<Store[]>([]);
  const [activeStore, setActiveStoreState] = useState<Store | null>(null);
  const [defaultWarehouse, setDefaultWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStores = async () => {
    if (!activeOrg) {
      setStores([]);
      setActiveStoreState(null);
      setDefaultWarehouse(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await StoreController.fetchStores(activeOrg.id);
      const storeList = data || [];
      setStores(storeList);

      if (storeList.length > 0 && !activeStore) {
        setActiveStoreState(storeList[0]);
      }
    } catch {
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch default warehouse when active store changes
  useEffect(() => {
    const loadWarehouse = async () => {
      if (!activeStore) {
        setDefaultWarehouse(null);
        return;
      }
      const { data } = await StoreController.fetchDefaultWarehouse(activeStore.id);
      setDefaultWarehouse(data || null);
    };
    loadWarehouse();
  }, [activeStore]);

  useEffect(() => {
    fetchStores();
  }, [activeOrg]);

  // Realtime subscription
  useEffect(() => {
    if (!activeOrg) return;

    const channel = supabase
      .channel('stores-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stores',
          filter: `organization_id=eq.${activeOrg.id}`,
        },
        () => {
          fetchStores();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrg]);

  const setActiveStore = (store: Store) => {
    setActiveStoreState(store);
  };

  const createStore = async (name: string, phone?: string, address?: string) => {
    if (!activeOrg || !user) {
      return { error: new Error('Organization or user not available.') };
    }

    const res = await StoreController.createStore({
      organizationId: activeOrg.id,
      userId: user.id,
      name,
      phone,
      address,
      currentStoreCount: stores.length,
      maxCapacity: 1, // Free tier
    });

    if (!res.error) {
      await fetchStores();
    }
    return { error: res.error };
  };

  const deleteStore = async (storeId: string) => {
    const res = await StoreController.deleteStore(storeId);
    if (!res.error) {
      await fetchStores();
      if (activeStore?.id === storeId) {
        setActiveStoreState(null);
      }
    }
    return { error: res.error };
  };

  return (
    <StoreContext.Provider
      value={{
        stores,
        activeStore,
        defaultWarehouse,
        loading,
        setActiveStore,
        createStore,
        deleteStore,
        refreshStores: fetchStores,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
