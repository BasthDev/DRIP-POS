import { supabase } from '@/lib/supabase';
import { InventoryValidator } from '@/validators/inventoryValidator';

export const InventoryController = {
  async receiveStockBatch(params: {
    organizationId: string;
    storeId: string;
    warehouseId: string;
    productId?: string | null;
    ingredientId?: string | null;
    batchNumber: string;
    quantity: number;
    unitCost: number;
    expiresAt?: string | null;
    notes?: string;
  }) {
    const val = InventoryValidator.validateStockIntake({
      batch_number: params.batchNumber,
      quantity: params.quantity,
      unit_cost: params.unitCost,
      target_id: params.ingredientId || params.productId || undefined,
    });
    if (!val.isValid) return { data: null, error: new Error(val.errors.join('\n')) };

    try {
      const { data, error } = await supabase.rpc('receive_stock_batch', {
        p_organization_id: params.organizationId,
        p_store_id: params.storeId,
        p_warehouse_id: params.warehouseId,
        p_product_id: params.productId || null,
        p_ingredient_id: params.ingredientId || null,
        p_batch_number: params.batchNumber.trim(),
        p_quantity: params.quantity,
        p_unit_cost: params.unitCost,
        p_expires_at: params.expiresAt || null,
        p_notes: params.notes || null,
      });

      if (error) return { data: null, error };
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  async fetchInventoryItems(orgId: string, storeId: string) {
    return await supabase
      .from('inventory_items')
      .select('*, ingredients(name, base_unit_id), products(name)')
      .eq('organization_id', orgId)
      .eq('store_id', storeId)
      .order('updated_at', { ascending: false });
  },

  async fetchStockBatches(orgId: string, storeId: string) {
    return await supabase
      .from('stock_batches')
      .select('*, ingredients(name), products(name)')
      .eq('organization_id', orgId)
      .eq('store_id', storeId)
      .eq('status', 'AVAILABLE')
      .order('received_at', { ascending: true });
  },

  async fetchStockMovements(orgId: string, storeId: string, limit: number = 50) {
    return await supabase
      .from('stock_movements')
      .select('*, ingredients(name), products(name)')
      .eq('organization_id', orgId)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(limit);
  },
};
