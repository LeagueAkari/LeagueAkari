const countFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

export function formatCount(value: number | null) {
  return value === null ? '—' : countFormatter.format(value)
}
