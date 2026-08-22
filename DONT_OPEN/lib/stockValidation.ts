import { supabase } from '@/lib/supabase';

export interface StockCheckItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface StockValidationResult {
  isValid: boolean;
  errors: string[];
  details: Array<{
    productName: string;
    ingredientName: string;
    required: number;
    available: number;
    unit: string;
  }>;
}

/**
 * Pre-flight stock validation before POS checkout.
 * Checks all recipe ingredients for all cart items.
 * Returns detailed shortage report if any ingredient is insufficient.
 */
export async function validateSaleStock(
  orgId: string,
  storeId: string,
  warehouseId: string,
  cartItems: StockCheckItem[]
): Promise<StockValidationResult> {
  const errors: string[] = [];
  const details: StockValidationResult['details'] = [];

  for (const cartItem of cartItems) {
    // 1. Check if product has an active recipe
    const { data: recipe } = await supabase
      .from('recipes')
      .select('id, current_version_id')
      .eq('product_id', cartItem.productId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (recipe && recipe.current_version_id) {
      // 2. Recipe-based product: check each ingredient
      const { data: recipeItems } = await supabase
        .from('recipe_items')
        .select('ingredient_id, quantity, wastage_percent, ingredients(name, base_unit_id, units:base_unit_id(symbol))')
        .eq('recipe_version_id', recipe.current_version_id);

      if (recipeItems) {
        for (const ri of recipeItems) {
          const wastageFactor = 1 + (ri.wastage_percent || 0) / 100;
          const totalRequired = ri.quantity * wastageFactor * cartItem.quantity;

          // Check available stock batches
          const { data: batchSum } = await supabase
            .from('stock_batches')
            .select('quantity_remaining')
            .eq('organization_id', orgId)
            .eq('store_id', storeId)
            .eq('warehouse_id', warehouseId)
            .eq('ingredient_id', ri.ingredient_id)
            .eq('status', 'AVAILABLE');

          const available = (batchSum || []).reduce(
            (sum: number, b: any) => sum + (b.quantity_remaining || 0),
            0
          );

          const ingredientInfo = ri.ingredients as any;
          const ingredientName = ingredientInfo?.name || 'Unknown';
          const unitSymbol = ingredientInfo?.units?.symbol || 'g';

          if (available < totalRequired) {
            errors.push(
              `"${cartItem.productName}" needs ${totalRequired.toFixed(1)} ${unitSymbol} of "${ingredientName}" but only ${available.toFixed(1)} ${unitSymbol} available.`
            );
            details.push({
              productName: cartItem.productName,
              ingredientName,
              required: totalRequired,
              available,
              unit: unitSymbol,
            });
          }
        }
      }
    } else {
      // 3. Direct product stock check (no recipe)
      const { data: product } = await supabase
        .from('products')
        .select('track_stock')
        .eq('id', cartItem.productId)
        .single();

      if (product?.track_stock) {
        const { data: batchSum } = await supabase
          .from('stock_batches')
          .select('quantity_remaining')
          .eq('organization_id', orgId)
          .eq('store_id', storeId)
          .eq('warehouse_id', warehouseId)
          .eq('product_id', cartItem.productId)
          .eq('status', 'AVAILABLE');

        const available = (batchSum || []).reduce(
          (sum: number, b: any) => sum + (b.quantity_remaining || 0),
          0
        );

        if (available < cartItem.quantity) {
          errors.push(
            `"${cartItem.productName}": Required ${cartItem.quantity} pcs but only ${available} pcs available.`
          );
          details.push({
            productName: cartItem.productName,
            ingredientName: cartItem.productName,
            required: cartItem.quantity,
            available,
            unit: 'pcs',
          });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    details,
  };
}
