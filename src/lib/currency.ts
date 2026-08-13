/** Cents -> "12,34" (no "R$" prefix, matches the plain-number inputs it feeds). */
export function formatReais(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** "12,34" or "12.34" -> 1234 cents, or null if not a valid non-negative amount. Shared between
 * AiCatalogEditor's flat-price input and CatalogItemSizesModal's per-size inputs — money parsing
 * shouldn't silently round differently in two places. */
export function parseReaisToCents(value: string): number | null {
  const normalized = value.trim().replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
}
