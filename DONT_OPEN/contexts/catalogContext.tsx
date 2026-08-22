import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from './organizationContext';
import { CatalogController } from '@/controllers/catalogController';

export interface Category {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  color: string;
  sort_order: number;
  status: string;
}

export interface Product {
  id: string;
  organization_id: string;
  category_id: string | null;
  base_unit_id: string | null;
  sku: string | null;
  barcode: string | null;
  name: string;
  description: string | null;
  product_type: string;
  track_stock: boolean;
  hpp_enabled: boolean;
  selling_price: number;
  cost_price: number;
  min_stock: number;
  image_url: string | null;
  status: string;
}

export interface Ingredient {
  id: string;
  organization_id: string;
  category_id: string | null;
  base_unit_id: string | null;
  name: string;
  sku: string | null;
  barcode: string | null;
  current_stock: number;
  min_stock: number;
  avg_cost: number;
  status: string;
}

export interface Unit {
  id: string;
  organization_id: string;
  name: string;
  symbol: string;
  unit_type: string;
  is_base: boolean;
}

interface CatalogState {
  categories: Category[];
  products: Product[];
  ingredients: Ingredient[];
  units: Unit[];
  loading: boolean;
  refreshCatalog: () => Promise<void>;
  // Category Actions
  createCategory: (name: string, description?: string, color?: string) => Promise<{ error: any }>;
  updateCategory: (id: string, name: string, description?: string, color?: string) => Promise<{ error: any }>;
  deleteCategory: (id: string) => Promise<{ error: any }>;
  // Product Actions
  createProduct: (productData: any, storeId?: string | null) => Promise<{ data: any; error: any }>;
  updateProduct: (id: string, productData: any) => Promise<{ error: any }>;
  deleteProduct: (id: string) => Promise<{ error: any }>;
  // Ingredient Actions
  createIngredient: (ingredientData: any, unitSymbol?: string) => Promise<{ data: any; error: any }>;
  updateIngredient: (id: string, ingredientData: any, unitSymbol?: string) => Promise<{ error: any }>;
  deleteIngredient: (id: string) => Promise<{ error: any }>;
}

const CatalogContext = createContext<CatalogState | undefined>(undefined);

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeOrg } = useOrganization();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    if (!activeOrg) {
      setCategories([]);
      setProducts([]);
      setIngredients([]);
      setUnits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [catRes, prodRes, ingRes, unitRes] = await Promise.all([
        supabase.from('categories').select('*').eq('organization_id', activeOrg.id).eq('status', 'active').order('sort_order'),
        supabase.from('products').select('*').eq('organization_id', activeOrg.id).eq('status', 'active').order('name'),
        supabase.from('ingredients').select('*').eq('organization_id', activeOrg.id).eq('status', 'active').order('name'),
        supabase.from('units').select('*').eq('organization_id', activeOrg.id).order('name'),
      ]);

      setCategories(catRes.data || []);
      setProducts(prodRes.data || []);
      setIngredients(ingRes.data || []);
      setUnits(unitRes.data || []);
    } catch {
      // Silent failure
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [activeOrg]);

  // Realtime subscriptions
  useEffect(() => {
    if (!activeOrg) return;

    const channel = supabase
      .channel('catalog-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `organization_id=eq.${activeOrg.id}` }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `organization_id=eq.${activeOrg.id}` }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ingredients', filter: `organization_id=eq.${activeOrg.id}` }, () => fetchAll())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrg]);

  // Category Wrappers
  const createCategory = async (name: string, description?: string, color?: string) => {
    if (!activeOrg) return { error: new Error('No active organization') };
    const res = await CatalogController.createCategory(activeOrg.id, name, description, color);
    if (!res.error) await fetchAll();
    return { error: res.error };
  };

  const updateCategory = async (id: string, name: string, description?: string, color?: string) => {
    const res = await CatalogController.updateCategory(id, name, description, color);
    if (!res.error) await fetchAll();
    return { error: res.error };
  };

  const deleteCategory = async (id: string) => {
    const res = await CatalogController.deleteCategory(id);
    if (!res.error) await fetchAll();
    return { error: res.error };
  };

  // Product Wrappers
  const createProduct = async (productData: any, storeId?: string | null) => {
    if (!activeOrg) return { data: null, error: new Error('No active organization') };
    const res = await CatalogController.createProduct(activeOrg.id, storeId || null, productData);
    if (!res.error) await fetchAll();
    return res;
  };

  const updateProduct = async (id: string, productData: any) => {
    const res = await CatalogController.updateProduct(id, productData);
    if (!res.error) await fetchAll();
    return { error: res.error };
  };

  const deleteProduct = async (id: string) => {
    const res = await CatalogController.deleteProduct(id);
    await fetchAll();
    return { error: res.error };
  };

  // Ingredient Wrappers
  const createIngredient = async (ingredientData: any, unitSymbol?: string) => {
    if (!activeOrg) return { data: null, error: new Error('No active organization') };
    const res = await CatalogController.createIngredient(activeOrg.id, ingredientData, unitSymbol);
    if (!res.error) await fetchAll();
    return res;
  };

  const updateIngredient = async (id: string, ingredientData: any, unitSymbol?: string) => {
    const res = await CatalogController.updateIngredient(id, ingredientData, unitSymbol);
    if (!res.error) await fetchAll();
    return { error: res.error };
  };

  const deleteIngredient = async (id: string) => {
    const res = await CatalogController.deleteIngredient(id);
    await fetchAll();
    return { error: res.error };
  };

  return (
    <CatalogContext.Provider
      value={{
        categories,
        products,
        ingredients,
        units,
        loading,
        refreshCatalog: fetchAll,
        createCategory,
        updateCategory,
        deleteCategory,
        createProduct,
        updateProduct,
        deleteProduct,
        createIngredient,
        updateIngredient,
        deleteIngredient,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
};
