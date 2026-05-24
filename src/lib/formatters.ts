import type { SpeedOrderFactor } from './schemas/question.schema';

/**
 * Formats a Speed Type A item's factor value for display in the post-submit reveal.
 * - 'price' → "$8.99" (USD currency)
 * - 'ABV' → "4.2% ABV"
 */
export function formatFactorValue(value: number, factor: SpeedOrderFactor): string {
  if (factor === 'price') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  }
  // 'ABV'
  return `${value.toFixed(1)}% ABV`;
}
