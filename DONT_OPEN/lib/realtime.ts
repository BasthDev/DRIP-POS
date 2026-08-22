import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeTable = 
  | 'products'
  | 'ingredients'
  | 'inventory_items'
  | 'stock_batches'
  | 'sales'
  | 'sale_items'
  | 'recipes'
  | 'recipe_items';

export interface RealtimeSubscriptionOptions {
  table: RealtimeTable;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

/**
 * Create a realtime subscription for database changes
 * Enables live updates across all POS terminals
 */
export function subscribeToTable({
  table,
  filter,
  onInsert,
  onUpdate,
  onDelete,
}: RealtimeSubscriptionOptions): RealtimeChannel {
  const channelName = `realtime:${table}:${filter || 'all'}`;
  
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter: filter ? parseFilter(filter) : undefined,
      },
      (payload) => {
        switch (payload.eventType) {
          case 'INSERT':
            onInsert?.(payload);
            break;
          case 'UPDATE':
            onUpdate?.(payload);
            break;
          case 'DELETE':
            onDelete?.(payload);
            break;
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Realtime] Subscribed to ${table}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`[Realtime] Error subscribing to ${table}`);
      }
    });

  return channel;
}

/**
 * Unsubscribe from a realtime channel
 */
export function unsubscribeFromChannel(channel: RealtimeChannel) {
  supabase.removeChannel(channel);
}

/**
 * Parse filter string to Supabase filter format
 * Example: "organization_id=eq.123" -> { column: 'organization_id', operator: 'eq', value: '123' }
 */
function parseFilter(filter: string): any {
  const [column, operator, value] = filter.split('.');
  return { column, operator, value };
}

/**
 * Subscribe to inventory changes for a specific warehouse
 * Used for live stock updates across POS terminals
 */
export function subscribeToInventoryChanges(
  warehouseId: string,
  callbacks: {
    onStockUpdate?: (payload: any) => void;
    onBatchUpdate?: (payload: any) => void;
  }
) {
  const inventoryChannel = subscribeToTable({
    table: 'inventory_items',
    filter: `warehouse_id=eq.${warehouseId}`,
    onUpdate: callbacks.onStockUpdate,
  });

  const batchChannel = subscribeToTable({
    table: 'stock_batches',
    filter: `warehouse_id=eq.${warehouseId}`,
    onUpdate: callbacks.onBatchUpdate,
  });

  return {
    inventory: inventoryChannel,
    batch: batchChannel,
    unsubscribeAll: () => {
      unsubscribeFromChannel(inventoryChannel);
      unsubscribeFromChannel(batchChannel);
    },
  };
}

/**
 * Subscribe to sales changes for a store
 * Used for live sales tracking and dashboard updates
 */
export function subscribeToSalesChanges(
  storeId: string,
  callbacks: {
    onNewSale?: (payload: any) => void;
    onSaleUpdate?: (payload: any) => void;
  }
) {
  const channel = subscribeToTable({
    table: 'sales',
    filter: `store_id=eq.${storeId}`,
    onInsert: callbacks.onNewSale,
    onUpdate: callbacks.onSaleUpdate,
  });

  return {
    channel,
    unsubscribe: () => unsubscribeFromChannel(channel),
  };
}

/**
 * Subscribe to product/ingredient catalog changes
 * Used for live menu updates
 */
export function subscribeToCatalogChanges(
  organizationId: string,
  callbacks: {
    onProductChange?: (payload: any) => void;
    onIngredientChange?: (payload: any) => void;
    onRecipeChange?: (payload: any) => void;
  }
) {
  const productChannel = subscribeToTable({
    table: 'products',
    filter: `organization_id=eq.${organizationId}`,
    onUpdate: callbacks.onProductChange,
  });

  const ingredientChannel = subscribeToTable({
    table: 'ingredients',
    filter: `organization_id=eq.${organizationId}`,
    onUpdate: callbacks.onIngredientChange,
  });

  const recipeChannel = subscribeToTable({
    table: 'recipes',
    filter: `organization_id=eq.${organizationId}`,
    onUpdate: callbacks.onRecipeChange,
  });

  return {
    unsubscribeAll: () => {
      unsubscribeFromChannel(productChannel);
      unsubscribeFromChannel(ingredientChannel);
      unsubscribeFromChannel(recipeChannel);
    },
  };
}
