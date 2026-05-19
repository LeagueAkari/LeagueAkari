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

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return 0
  }

  const index = p * (sorted.length - 1)
  const lower = Math.floor(index)
  const fraction = index - lower

  if (lower === sorted.length - 1) {
    return sorted[lower]
  }

  return sorted[lower] + fraction * (sorted[lower + 1] - sorted[lower])
}

/**
 * 是找出过高高评分和过低评分的玩家
 */
export function findOutliersByIqr<T>(
  data: T[],
  keyGetter?: (value: T) => number,
  threshold: number = 1.5
): { below: T[]; over: T[] } {
  if (!keyGetter) {
    keyGetter = (value: T) => value as any as number
  }

  const sorted = data.slice().sort((a, b) => keyGetter(a) - keyGetter(b))
  const q1 = percentile(sorted.map(keyGetter), 0.25)
  const q3 = percentile(sorted.map(keyGetter), 0.75)
  const iqr = q3 - q1
  const lowerBound = q1 - threshold * iqr
  const upperBound = q3 + threshold * iqr

  const below: T[] = []
  const over: T[] = []

  for (const d of data) {
    if (keyGetter(d) < lowerBound) {
      below.push(d)
    } else if (keyGetter(d) > upperBound) {
      over.push(d)
    }
  }

  return {
    below,
    over
  }
}

// aggregate 系列工具是测试特性

export type Aggregator<T, R> = (items: T[]) => R

export type Getter<T, R> = (item: T) => R

export type MapRule<T, N extends string, GR, AR> = {
  name: N
  getter: Getter<T, GR>
  aggregator: Aggregator<GR, AR>
}

/**
 * 类型工具，用这个可以获得类型推导
 */
export function rule<T, const N extends string, GR, AR>(rule: {
  name: N
  getter: (item: T) => GR
  aggregator: (values: GR[]) => AR
}): MapRule<T, N, GR, AR> {
  return rule
}

export function aggregate<T, R extends readonly MapRule<T, string, any, any>[]>(
  items: T[],
  rules: R
): {
  [K in R[number] as K['name']]: ReturnType<K['aggregator']>
} {
  return rules.reduce(
    (acc, rule) => {
      acc[rule.name] = rule.aggregator(items.map(rule.getter))
      return acc
    },
    {} as {
      [K in R[number] as K['name']]: ReturnType<K['aggregator']>
    }
  )
}
