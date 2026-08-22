import { RecipeExtra, RecipeIngredient } from "../constants/types";

export function calculateHPP(
  recipeIngredients: { cost_per_gram?: number | null; qty_used: number }[],
  extras: RecipeExtra[],
): number {
  const ingredientCost = recipeIngredients.reduce((sum, ri) => {
    const cpg = ri.cost_per_gram ?? 0;
    return sum + cpg * ri.qty_used;
  }, 0);

  const extrasFlat = extras
    .filter((e) => e.value_type === "flat")
    .reduce((sum, e) => sum + (Number(e.value) || 0), 0);

  const extrasPercent = extras
    .filter((e) => e.value_type === "percentage")
    .reduce((sum, e) => sum + ingredientCost * ((Number(e.value) || 0) / 100), 0);

  return Math.round((ingredientCost + extrasFlat + extrasPercent) * 100) / 100;
}
