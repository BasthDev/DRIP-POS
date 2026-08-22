import { CostType, ItemUnit } from "../constants/types";

export function cleanQty(v: number): number {
  if (v == null || isNaN(v)) return 0;
  if (Math.abs(v) < 1e-9) return 0;
  return parseFloat(v.toFixed(4));
}

export function normaliseQty(qty: number, unit: ItemUnit): number {
  if (unit === "kg") return qty * 1000;
  if (unit === "l") return qty * 1000;
  return qty;
}

export function getUnitMultiplier(unit: ItemUnit | string | null | undefined): number {
  if (unit === "kg" || unit === "l") return 1000;
  return 1;
}

export function getBaseUnit(unit: ItemUnit | string | null | undefined): string {
  if (unit === "kg") return "g";
  if (unit === "l") return "ml";
  return unit ?? "";
}

export function getCompatibleUnits(unit: ItemUnit | string | null | undefined): ItemUnit[] {
  if (unit === "kg" || unit === "g") {
    return ["g", "kg"];
  }
  if (unit === "l" || unit === "ml") {
    return ["ml", "l"];
  }
  if (unit === "pcs") {
    return ["pcs"];
  }
  return ["g", "kg", "ml", "l", "pcs"];
}

export function computeCostPerGram(
  costType: CostType,
  buyPrice: number | null,
  itemQty: number | null,
  itemUnit: ItemUnit | null,
): number | null {
  if (costType === "per_gram_manual") return null;
  if (costType === "per_pcs") return buyPrice;
  if (
    costType === "per_gram_auto" &&
    buyPrice != null &&
    itemQty != null &&
    itemUnit != null
  ) {
    const normalised = normaliseQty(itemQty, itemUnit);
    return normalised > 0 ? buyPrice / normalised : null;
  }
  return null;
}

export function formatQtyWithUnit(
  qty: number,
  unit: ItemUnit | string | null | undefined,
  showBaseDetail: boolean = true
): string {
  const q = cleanQty(qty);
  const isKg = unit === "kg";
  const isL = unit === "l";
  const unitStr = unit ?? "";

  if ((isKg || isL) && showBaseDetail) {
    const baseVal = Math.round(q * 1000);
    const baseUnit = isKg ? "g" : "ml";
    const qtyStr = Number.isInteger(q) ? q.toString() : q.toFixed(3).replace(/\.?0+$/, "");
    return `${qtyStr} ${unitStr} (${baseVal.toLocaleString()} ${baseUnit})`;
  }

  const qtyStr = Number.isInteger(q) ? q.toString() : q.toFixed(2).replace(/\.?0+$/, "");
  return `${qtyStr} ${unitStr}`.trim();
}
