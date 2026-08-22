export type ItemUnit = 'g' | 'kg' | 'ml' | 'l' | 'pcs' | 'box';

/**
 * Sanitise floating-point values to avoid IEEE 754 precision noise.
 */
export function cleanQty(v: number): number {
  if (v == null || isNaN(v)) return 0;
  if (Math.abs(v) < 1e-9) return 0;
  return parseFloat(v.toFixed(4));
}

/**
 * Get multiplier to normalize bulk intake units to portion units.
 * kg -> 1000, l -> 1000, others -> 1
 */
export function getUnitMultiplier(unit?: string | null): number {
  if (!unit) return 1;
  const u = unit.toLowerCase();
  if (u === 'kg' || u === 'l' || u === 'liter' || u === 'litre') return 1000;
  return 1;
}

/**
 * Get base portion unit symbol.
 * kg -> g, l -> ml, others -> same
 */
export function getBasePortionUnit(unit?: string | null): string {
  if (!unit) return 'g';
  const u = unit.toLowerCase();
  if (u === 'kg') return 'g';
  if (u === 'l' || u === 'liter' || u === 'litre') return 'ml';
  return unit;
}

/**
 * Format quantity with proper unit display.
 */
export function formatQtyWithUnit(qty: number, unit?: string | null): string {
  const q = cleanQty(qty);
  const u = unit || '';
  if (Number.isInteger(q)) return `${q} ${u}`.trim();
  return `${q.toFixed(2).replace(/\.?0+$/, '')} ${u}`.trim();
}
