import { getUnitMultiplier } from './units';

export interface IngredientCostInput {
  avg_cost: number; // Purchase price (e.g. 120,000 IDR for 1kg)
  base_unit_symbol?: string | null; // e.g. "kg", "g", "L", "pcs"
}

export const HPPCalculator = {
  /**
   * Compute cost per portion unit (gram / ml / pcs)
   * e.g. Rp 120,000 / kg -> Rp 120 / gram
   */
  computeCostPerSmallUnit(ingredient: IngredientCostInput): number {
    const rawCost = ingredient.avg_cost || 0;
    const multiplier = getUnitMultiplier(ingredient.base_unit_symbol);
    return multiplier > 0 ? rawCost / multiplier : rawCost;
  },

  /**
   * Calculate single recipe item cost considering portion quantity and wastage %
   */
  calculateRecipeItemCost(
    ingredient: IngredientCostInput,
    quantity: number,
    wastagePercent: number = 0
  ): number {
    const costPerSmall = this.computeCostPerSmallUnit(ingredient);
    const wastageFactor = 1 + Math.max(0, wastagePercent) / 100;
    return quantity * wastageFactor * costPerSmall;
  },

  /**
   * Calculate total estimated recipe HPP
   */
  calculateTotalHPP(
    items: Array<{
      ingredient: IngredientCostInput;
      quantity: number;
      wastage_percent?: number;
    }>,
    flatExtras: number = 0,
    percentageExtras: number = 0
  ): number {
    const baseIngredientsCost = items.reduce(
      (sum, item) => sum + this.calculateRecipeItemCost(item.ingredient, item.quantity, item.wastage_percent || 0),
      0
    );
    const percentCost = baseIngredientsCost * (Math.max(0, percentageExtras) / 100);
    return baseIngredientsCost + flatExtras + percentCost;
  },

  /**
   * Calculate profit margin & gross profit
   */
  calculateMargin(sellingPrice: number, hppCost: number): { grossProfit: number; marginPercent: number } {
    const grossProfit = sellingPrice - hppCost;
    const marginPercent = sellingPrice > 0 ? Math.round((grossProfit / sellingPrice) * 100) : 0;
    return { grossProfit, marginPercent };
  },
};
