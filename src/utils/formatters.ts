/**
 * Format a number as Philippine Peso currency.
 */
export function formatPHP(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Format a decimal rate as a percentage string (e.g. 0.06 → "6.00%")
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`
}

/**
 * Format a number compactly (e.g. 1500000 → "₱1.5M")
 */
export function formatCompact(value: number): string {
  if (value >= 1_000_000) {
    return `₱${(value / 1_000_000).toFixed(2)}M`
  }
  if (value >= 1_000) {
    return `₱${(value / 1_000).toFixed(1)}K`
  }
  return formatPHP(value)
}

/**
 * Parse a percentage string to decimal (e.g. "6" or "6.5" → 0.065)
 */
export function parsePercentInput(input: string): number {
  const n = parseFloat(input)
  return isNaN(n) ? 0 : n / 100
}
