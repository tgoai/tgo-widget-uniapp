/**
 * 格式化价格
 */
export function formatPrice(price: number | undefined | null, currency: string = '¥'): string {
  if (price === undefined || price === null) {
    return `${currency}0.00`
  }
  return `${currency}${price.toFixed(2)}`
}
