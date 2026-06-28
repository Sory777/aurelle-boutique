/**
 * Shared display formatters for the AURÉLLE storefront.
 *
 * Prices in this demo are whole USD units. The transactional backend will
 * switch to integer minor units (cents) — see design.md → Money — at which
 * point this helper becomes the single place to adjust currency formatting.
 */

const priceFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format a price as a localized currency string with two decimals. */
export function formatPrice(value: number): string {
  return priceFormatter.format(value);
}
