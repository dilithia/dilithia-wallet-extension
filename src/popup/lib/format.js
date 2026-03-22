/**
 * Display formatting helpers shared across popup screens.
 * These are pure functions with no side effects or state.
 */

/**
 * Truncate a hex address or hash for display.
 * "dili1abc...xyz123" style — keeps prefix and suffix visible.
 */
export function truncateAddress(value, maxLen = 18) {
  const text = String(value ?? "");
  if (text.length <= maxLen) return text;
  const keep = Math.max(6, Math.floor((maxLen - 3) / 2));
  return `${text.slice(0, keep + 2)}...${text.slice(-keep)}`;
}

/**
 * Truncate any string to maxLen with ellipsis.
 */
export function truncate(value, maxLen = 24) {
  const s = String(value ?? "");
  return s.length <= maxLen ? s : `${s.slice(0, maxLen - 1)}…`;
}

/**
 * Build a DiliScan explorer URL with hash routing.
 * Returns null if baseUrl or value is missing.
 */
export function buildExplorerUrl(baseUrl, kind, value) {
  if (!baseUrl || !value) return null;
  const base = String(baseUrl).replace(/\/+$/, "");
  return `${base}/#/${kind}/${encodeURIComponent(String(value))}`;
}

/**
 * Extract hostname from an origin URL.
 */
export function originHostname(origin) {
  try { return new URL(origin).hostname; } catch { return origin; }
}
