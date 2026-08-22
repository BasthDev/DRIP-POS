import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from './organizationContext';
import { useStore } from './storeContext';
import { Product, Ingredient } from './catalogContext';

export interface Warehouse {
  id: string;
  store_id: string;
  name: string;
  code: string;
  is_default: boolean;
  status: string;
}

export interface InventoryItem {
  id: string;
  warehouse_id: string;
  product_id?: string;
  ingredient_id?: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  product?: Product;
  ingredient?: Ingredient;
}

export interface StockBatch {
  id: string;
  organization_id: string;
  store_id: string;
  warehouse_id: string;
  product_id?: string;
  ingredient_id?: string;
  batch_number: string;
  quantity_received: number;
  quantity_remaining: number;
  unit_cost: number;
  total_cost: number;
  received_at: string;
  expires_at?: string;
  status: string;
  product?: Product;
  ingredient?: Ingredient;
}

export interface StockMovement {
  id: string;
  movement_type: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  reason?: string;
  created_at: string;
  created_by?: string;
}

interface InventoryContextType {
  warehouses: Warehouse[];
  currentWarehouse: Warehouse | null;
  inventoryItems: InventoryItem[];
  batches: StockBatch[];
  loading: boolean;
  switchWarehouse: (warehouseId: string) => void;
  refreshInventory: () => Promise<void>;
  receiveStock: (params: {
    productId?: string;
    ingredientId?: string;
    batchNumber: string;
    quantity: number;
    unitCost: number;
    expiresAt?: string;
    notes?: string;
  }) => Promise<{ data: any; error: any }>;
  allocateAndConsume: (params: {
    productId?: string;
    ingredientId?: string;
    quantityNeeded: number;
    method?: 'FIFO' | 'FEFO';
    referenceType?: string;
    referenceId?: string;
  }) => Promise<{ data: any; error: any }>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentOrganization } = useOrganization();
  const { currentStore } = useStore();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [currentWarehouse, setCurrentWarehouse] = useState<Warehouse | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [batches, setBatches] = useState<StockBatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchInventory = async () => {
    if (!currentOrganization || !currentStore) {
      setWarehouses([]);
      setCurrentWarehouse(null);
      setInventoryItems([]);
      setBatches([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // 1. Fetch Warehouses for store
      const { data: whData, error: whError } = await supabase
        .from('warehouses')
        .select('*')
        .eq('store_id', currentStore.id)
        .eq('status', 'active');

      if (whError) console.error('Error fetching warehouses:', whError);

      const whList = (whData as Warehouse[]) || [];
      setWarehouses(whList);

      let activeWarehouse = currentWarehouse;
      if (!activeWarehouse || !whList.some((w) => w.id === activeWarehouse?.id)) {
        activeWarehouse = whList[0] || null;
      }
      setCurrentWarehouse(activeWarehouse);

      if (activeWarehouse) {
        // 2. Fetch inventory balances
        const { data: itemData } = await supabase
          .from('inventory_items')
          .select('*, product:products(*), ingredient:ingredients(*)')
          .eq('warehouse_id', activeWarehouse.id);

        setInventoryItems((itemData as InventoryItem[]) || []);

        // 3. Fetch active batches
        const { data: batchData } = await supabase
          .from('stock_batches')
          .select('*, product:products(*), ingredient:ingredients(*)')
          .eq('warehouse_id', activeWarehouse.id)
          .eq('status', 'AVAILABLE')
          .gt('quantity_remaining', 0)
          .order('received_at', { ascending: true });

        setBatches((batchData as StockBatch[]) || []);
      }
    } catch (err) {
      console.error('Error in fetchInventory:', err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription to inventory & stock changes
  useEffect(() => {
    fetchInventory();

    if (!currentStore) return;

    const channel = supabase
      .channel(`realtime-inventory-${currentStore.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stock_batches', filter: `store_id=eq.${currentStore.id}` },
        () => fetchInventory()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory_items' },
        () => fetchInventory()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrganization, currentStore]);

  const switchWarehouse = (warehouseId: string) => {
    const selected = warehouses.find((w) => w.id === warehouseId);
    if (selected) {
      setCurrentWarehouse(selected);
    }
  };

  const receiveStock = async ({
    productId,
    ingredientId,
    batchNumber,
    quantity,
    unitCost,
    expiresAt,
    notes,
  }: {
    productId?: string;
    ingredientId?: string;
    batchNumber: string;
    quantity: number;
    unitCost: number;
    expiresAt?: string;
    notes?: string;
  }) => {
    if (!currentOrganization || !currentStore || !currentWarehouse) {
      return { data: null, error: new Error('Missing organization or warehouse context') };
    }

    const { data, error } = await supabase.rpc('receive_stock_batch', {
      p_organization_id: currentOrganization.id,
      p_store_id: currentStore.id,
      p_warehouse_id: currentWarehouse.id,
      p_product_id: productId || null,
      p_ingredient_id: ingredientId || null,
      p_batch_number: batchNumber,
      p_quantity: quantity,
      p_unit_cost: unitCost,
      p_expires_at: expiresAt || null,
      p_notes: notes || null,
    });

    if (!error) {
      await fetchInventory();
    }
    return { data, error };
  };

  const allocateAndConsume = async ({
    productId,
    ingredientId,
    quantityNeeded,
    method = 'FIFO',
    referenceType = 'sale',
    referenceId,
  }: {
    productId?: string;
    ingredientId?: string;
    quantityNeeded: number;
    method?: 'FIFO' | 'FEFO';
    referenceType?: string;
    referenceId?: string;
  }) => {
    if (!currentOrganization || !currentStore || !currentWarehouse) {
      return { data: null, error: new Error('Missing warehouse context') };
    }

    const { data, error } = await supabase.rpc('allocate_and_consume_stock', {
      p_organization_id: currentOrganization.id,
      p_store_id: currentStore.id,
      p_warehouse_id: currentWarehouse.id,
      p_product_id: productId || null,
      p_ingredient_id: ingredientId || null,
      p_quantity_needed: quantityNeeded,
      p_method: method,
      p_reference_type: referenceType,
      p_reference_id: referenceId || null,
    });

    if (!error) {
      await fetchInventory();
    }
    return { data, error };
  };

  return (
    <InventoryContext.Provider
      value={{
        warehouses,
        currentWarehouse,
        inventoryItems,
        batches,
        loading,
        switchWarehouse,
        refreshInventory: fetchInventory,
        receiveStock,
        allocateAndConsume,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
