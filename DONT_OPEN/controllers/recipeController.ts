import { supabase } from '@/lib/supabase';
import { RecipeValidator, RecipeItemInput } from '@/validators/recipeValidator';

export const RecipeController = {
  async createRecipe(
    orgId: string,
    recipeName: string,
    items: RecipeItemInput[],
    productId?: string,
    yieldQuantity: number = 1,
    notes?: string
  ) {
    const val = RecipeValidator.validateRecipe({ name: recipeName, items });
    if (!val.isValid) return { data: null, error: new Error(val.errors.join('\n')) };

    try {
      // 1. Create Recipe Master
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          organization_id: orgId,
          product_id: productId || null,
          name: recipeName.trim(),
          inventory_method: 'FIFO',
          status: 'active',
        })
        .select()
        .single();

      if (recipeError) return { data: null, error: recipeError };

      // 2. Create Recipe Version #1
      const { data: version, error: versionError } = await supabase
        .from('recipe_versions')
        .insert({
          organization_id: orgId,
          recipe_id: recipe.id,
          version_number: 1,
          yield_quantity: yieldQuantity,
          notes: notes || null,
        })
        .select()
        .single();

      if (versionError) return { data: null, error: versionError };

      // 3. Update current_version_id
      await supabase
        .from('recipes')
        .update({ current_version_id: version.id })
        .eq('id', recipe.id);

      // 4. Insert Items
      const itemsPayload = items.map((it) => ({
        organization_id: orgId,
        recipe_version_id: version.id,
        ingredient_id: it.ingredient_id,
        quantity: it.quantity,
        unit_id: it.unit_id,
        wastage_percent: it.wastage_percent || 0,
      }));

      const { error: itemsError } = await supabase
        .from('recipe_items')
        .insert(itemsPayload);

      if (itemsError) return { data: null, error: itemsError };

      return { data: recipe, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  async updateRecipe(
    recipeId: string,
    orgId: string,
    recipeName: string,
    items: RecipeItemInput[],
    productId?: string,
    yieldQuantity: number = 1,
    notes?: string
  ) {
    const val = RecipeValidator.validateRecipe({ name: recipeName, items });
    if (!val.isValid) return { data: null, error: new Error(val.errors.join('\n')) };

    try {
      // 1. Update recipe header
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .update({
          name: recipeName.trim(),
          product_id: productId || null,
        })
        .eq('id', recipeId)
        .select()
        .single();

      if (recipeError) return { data: null, error: recipeError };

      // 2. Get next version number
      const { data: currentVersions } = await supabase
        .from('recipe_versions')
        .select('version_number')
        .eq('recipe_id', recipeId)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVer = (currentVersions?.[0]?.version_number || 1) + 1;

      // 3. Create immutable new snapshot
      const { data: newVersion, error: verError } = await supabase
        .from('recipe_versions')
        .insert({
          organization_id: orgId,
          recipe_id: recipeId,
          version_number: nextVer,
          yield_quantity: yieldQuantity,
          notes: notes || null,
        })
        .select()
        .single();

      if (verError) return { data: null, error: verError };

      // 4. Update current_version_id
      await supabase
        .from('recipes')
        .update({ current_version_id: newVersion.id })
        .eq('id', recipeId);

      // 5. Insert new items
      const itemsPayload = items.map((it) => ({
        organization_id: orgId,
        recipe_version_id: newVersion.id,
        ingredient_id: it.ingredient_id,
        quantity: it.quantity,
        unit_id: it.unit_id,
        wastage_percent: it.wastage_percent || 0,
      }));

      await supabase.from('recipe_items').insert(itemsPayload);

      return { data: recipe, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  async deleteRecipe(id: string) {
    const { error: rpcErr } = await supabase.rpc('hard_delete_recipe', { p_recipe_id: id });
    if (rpcErr) {
      await supabase.from('recipes').delete().eq('id', id);
    }
    return { error: null };
  },
};
