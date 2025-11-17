export function calculateCoefficientOfVariation(numbers: number[]): number {
  if (!numbers || numbers.length === 0) {
    return -1
  }

  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length
  if (mean === 0) {
    return -1
  }

  const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length
  const standardDeviation = Math.sqrt(variance)

  return standardDeviation / mean
}

export function noZero(value: number) {
  return value || 1
}

export function standardize(numbers: number[]): number[] {
  if (numbers.length === 0) return []

  const min = Math.min(...numbers)
  const max = Math.max(...numbers)
  const range = max - min

  if (range === 0) {
    return new Array(numbers.length).fill(0)
  }

  // 标准化计算
  return numbers.map((num) => (num - min) / range)
}
