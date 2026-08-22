import { supabase } from '@/lib/supabase';
import { StoreValidator } from '@/validators/storeValidator';

export const StoreController = {
  async createStore(params: {
    organizationId: string;
    userId: string;
    name: string;
    phone?: string;
    address?: string;
    currentStoreCount: number;
    maxCapacity?: number;
  }) {
    const val = StoreValidator.validateCreateStore(
      { name: params.name, phone: params.phone, address: params.address },
      params.currentStoreCount,
      params.maxCapacity || 1
    );
    if (!val.isValid) return { data: null, error: new Error(val.errors.join('\n')) };

    try {
      const slug =
        params.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') +
        '-' +
        Math.random().toString(36).substring(2, 6);

      // 1. Create store
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert({
          organization_id: params.organizationId,
          name: params.name.trim(),
          slug,
          phone: params.phone?.trim() || null,
          address: params.address?.trim() || null,
          currency: 'IDR',
          timezone: 'Asia/Jakarta',
          is_active: true,
          status: 'active',
        })
        .select()
        .single();

      if (storeError) return { data: null, error: storeError };

      // 2. Add creator as store member
      await supabase.from('store_members').insert({
        store_id: store.id,
        user_id: params.userId,
        role: 'manager',
      });

      // 3. Create default warehouse
      await supabase.from('warehouses').insert({
        organization_id: params.organizationId,
        store_id: store.id,
        name: 'Main Warehouse',
        is_default: true,
        status: 'active',
      });

      return { data: store, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  async deleteStore(storeId: string) {
    try {
      const { error: rpcErr } = await supabase.rpc('delete_store_cascade', {
        p_store_id: storeId,
      });

      if (rpcErr) {
        // Fallback: direct delete (CASCADE constraints will clean up children)
        await supabase.from('stores').delete().eq('id', storeId);
      }

      return { error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  async fetchStores(orgId: string) {
    return await supabase
      .from('stores')
      .select('*')
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });
  },

  async fetchDefaultWarehouse(storeId: string) {
    return await supabase
      .from('warehouses')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_default', true)
      .single();
  },
};
