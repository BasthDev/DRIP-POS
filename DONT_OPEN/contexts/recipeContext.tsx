import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from './organizationContext';
import { RecipeController } from '@/controllers/recipeController';
import { RecipeItemInput } from '@/validators/recipeValidator';

export interface Recipe {
  id: string;
  organization_id: string;
  product_id: string | null;
  name: string;
  description: string | null;
  current_version_id: string | null;
  status: string;
}

export interface RecipeVersion {
  id: string;
  recipe_id: string;
  version_number: number;
  yield_quantity: number;
  notes: string | null;
}

export interface RecipeItem {
  id: string;
  recipe_version_id: string;
  ingredient_id: string;
  quantity: number;
  unit_id: string;
  wastage_percent: number;
}

interface RecipeState {
  recipes: Recipe[];
  loading: boolean;
  refreshRecipes: () => Promise<void>;
  createRecipe: (name: string, items: RecipeItemInput[], productId?: string, yieldQty?: number, notes?: string) => Promise<{ data: any; error: any }>;
  updateRecipe: (recipeId: string, name: string, items: RecipeItemInput[], productId?: string, yieldQty?: number, notes?: string) => Promise<{ data: any; error: any }>;
  deleteRecipe: (id: string) => Promise<{ error: any }>;
  fetchRecipeItems: (versionId: string) => Promise<RecipeItem[]>;
}

const RecipeContext = createContext<RecipeState | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeOrg } = useOrganization();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecipes = async () => {
    if (!activeOrg) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabase
        .from('recipes')
        .select('*')
        .eq('organization_id', activeOrg.id)
        .eq('status', 'active')
        .order('name');

      setRecipes(data || []);
    } catch {
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [activeOrg]);

  const createRecipe = async (name: string, items: RecipeItemInput[], productId?: string, yieldQty?: number, notes?: string) => {
    if (!activeOrg) return { data: null, error: new Error('No active organization') };
    const res = await RecipeController.createRecipe(activeOrg.id, name, items, productId, yieldQty, notes);
    if (!res.error) await fetchRecipes();
    return res;
  };

  const updateRecipe = async (recipeId: string, name: string, items: RecipeItemInput[], productId?: string, yieldQty?: number, notes?: string) => {
    if (!activeOrg) return { data: null, error: new Error('No active organization') };
    const res = await RecipeController.updateRecipe(recipeId, activeOrg.id, name, items, productId, yieldQty, notes);
    if (!res.error) await fetchRecipes();
    return res;
  };

  const deleteRecipe = async (id: string) => {
    const res = await RecipeController.deleteRecipe(id);
    await fetchRecipes();
    return { error: res.error };
  };

  const fetchRecipeItems = async (versionId: string): Promise<RecipeItem[]> => {
    const { data } = await supabase
      .from('recipe_items')
      .select('*')
      .eq('recipe_version_id', versionId);
    return data || [];
  };

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        loading,
        refreshRecipes: fetchRecipes,
        createRecipe,
        updateRecipe,
        deleteRecipe,
        fetchRecipeItems,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
};
