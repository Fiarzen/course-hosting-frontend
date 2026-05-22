export const CURRENCY_OPTIONS = [
  { value: 'gbp', label: 'GBP (£)' },
  { value: 'usd', label: 'USD ($)' },
  { value: 'eur', label: 'EUR (€)' },
];

export function formatPrice(priceCents, currency) {
  if (!priceCents || !currency) return null;
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(priceCents / 100);
  } catch {
    return `${currency.toUpperCase()} ${(priceCents / 100).toFixed(2)}`;
  }
}
