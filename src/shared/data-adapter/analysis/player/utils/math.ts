import { noZero } from '../../../utils'

export function avgOrZero(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((s, v) => s + v, 0) / noZero(values.length)
}

export function avgOrOne(values: number[]): number {
  if (values.length === 0) return 1
  return values.reduce((s, v) => s + v, 0) / noZero(values.length)
}

export function avgOrNull(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((s, v) => s + v, 0) / values.length
}

export function avgIfAllNonNull(values: (number | null)[]): number | null {
  if (values.length === 0) return null
  const allNonNull = values.every((v) => v !== null)
  if (!allNonNull) return null
  const nonNulls = values as number[]
  return nonNulls.reduce((s, v) => s + v, 0) / noZero(nonNulls.length)
}
