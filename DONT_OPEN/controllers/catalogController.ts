import { supabase } from '@/lib/supabase';
import { CategoryValidator } from '@/validators/categoryValidator';
import { ProductValidator } from '@/validators/productValidator';
import { IngredientValidator, CostCalculationMode } from '@/validators/ingredientValidator';
import { getUnitMultiplier } from '@/lib/units';

export const CatalogController = {
  // Category Actions
  async createCategory(orgId: string, name: string, description?: string, color?: string) {
    const val = CategoryValidator.validateCategory({ name, description, color });
    if (!val.isValid) return { data: null, error: new Error(val.errors.join('\n')) };

    return await supabase
      .from('categories')
      .insert({
        organization_id: orgId,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#065F46',
        status: 'active',
      })
      .select()
      .single();
  },

  async updateCategory(id: string, name: string, description?: string, color?: string) {
    const val = CategoryValidator.validateCategory({ name, description, color });
    if (!val.isValid) return { data: null, error: new Error(val.errors.join('\n')) };

    return await supabase
      .from('categories')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#065F46',
      })
      .eq('id', id)
      .select()
      .single();
  },

  async deleteCategory(id: string) {
    return await supabase.from('categories').delete().eq('id', id);
  },

  // Product Actions
  async createProduct(orgId: string, storeId: string | null, productData: any) {
    const val = ProductValidator.validateProduct(productData);
    if (!val.isValid) return { data: null, error: new Error(val.errors.join('\n')) };

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        ...productData,
        organization_id: orgId,
        status: 'active',
      })
      .select()
      .single();

    if (error) return { data: null, error };

    if (storeId && product) {
      await supabase.from('store_products').insert({
        store_id: storeId,
        product_id: product.id,
        selling_price: product.selling_price,
        is_available: true,
      });
    }

    return { data: product, error: null };
  },

  async updateProduct(id: string, productData: any) {
    const val = ProductValidator.validateProduct(productData);
    if (!val.isValid) return { data: null, error: new Error(val.errors.join('\n')) };

    return await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();
  },

  async deleteProduct(id: string) {
    const { error: rpcErr } = await supabase.rpc('hard_delete_product', { p_product_id: id });
    if (rpcErr) {
      await supabase.from('products').delete().eq('id', id);
    }
    return { error: null };
  },

  // Ingredient Actions
  async createIngredient(orgId: string, ingredientData: any, unitSymbol?: string) {
    const val = IngredientValidator.validateIngredient(ingredientData);
    if (!val.isValid) return { data: null, error: new Error(val.errors.join('\n')) };

    let finalAvgCost = ingredientData.buy_price || 0;
    if (ingredientData.cost_type === 'per_gram_manual') {
      const mult = getUnitMultiplier(unitSymbol);
      finalAvgCost = (ingredientData.cost_per_gram_manual || 0) * mult;
    }

    return await supabase
      .from('ingredients')
      .insert({
        organization_id: orgId,
        name: ingredientData.name.trim(),
        sku: ingredientData.sku?.trim() || null,
        base_unit_id: ingredientData.base_unit_id,
        min_stock: ingredientData.min_stock || 0,
        avg_cost: finalAvgCost,
        track_batch: true,
        track_expiry: true,
        inventory_method: 'FIFO',
        status: 'active',
      })
      .select()
      .single();
  },

  async updateIngredient(id: string, ingredientData: any, unitSymbol?: string) {
    const val = IngredientValidator.validateIngredient(ingredientData);
    if (!val.isValid) return { data: null, error: new Error(val.errors.join('\n')) };

    let finalAvgCost = ingredientData.buy_price || 0;
    if (ingredientData.cost_type === 'per_gram_manual') {
      const mult = getUnitMultiplier(unitSymbol);
      finalAvgCost = (ingredientData.cost_per_gram_manual || 0) * mult;
    }

    return await supabase
      .from('ingredients')
      .update({
        name: ingredientData.name.trim(),
        sku: ingredientData.sku?.trim() || null,
        base_unit_id: ingredientData.base_unit_id,
        min_stock: ingredientData.min_stock || 0,
        avg_cost: finalAvgCost,
      })
      .eq('id', id)
      .select()
      .single();
  },

  async deleteIngredient(id: string) {
    const { error: rpcErr } = await supabase.rpc('hard_delete_ingredient', { p_ingredient_id: id });
    if (rpcErr) {
      await supabase.from('ingredients').delete().eq('id', id);
    }
    return { error: null };
  },
};
