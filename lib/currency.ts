export function formatCurrency(amount: number | null | undefined, currency: 'IDR' | 'USD' = 'IDR'): string {
  const value = amount ?? 0;
  if (currency === 'USD') {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}
