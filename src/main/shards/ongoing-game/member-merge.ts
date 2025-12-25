export function memberMerge(origin: string[], extra: string[]): string[] {
  const n = origin.length
  const m = extra.length

  // 错位检查，错位直接尾接
  const originSet = new Set(origin)
  const extraSet = new Set(extra)

  const overlapSet = new Set<string>()
  for (const x of originSet) {
    if (extraSet.has(x)) {
      overlapSet.add(x)
    }
  }

  const originOverlap = origin.filter((x) => overlapSet.has(x))
  const extraOverlap = extra.filter((x) => overlapSet.has(x))

  const orderIsCorrect =
    originOverlap.length === extraOverlap.length &&
    originOverlap.every((v, idx) => v === extraOverlap[idx])

  if (!orderIsCorrect) {
    const uniqueFromExtra = extra.filter((x) => !originSet.has(x))
    return origin.concat(uniqueFromExtra)
  }

  // LCS 插入
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0))

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (origin[i] === extra[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1])
      }
    }
  }

  const pairs: Array<{ i: number; j: number }> = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (origin[i] === extra[j]) {
      pairs.push({ i, j })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++
    } else {
      j++
    }
  }

  // 目前局部的合并顺序是先 origin 后 extra，而不是依次拼接
  // e.g. A,B,T + C,D,T -> A,B,C,D,T
  const result: string[] = []
  i = 0
  j = 0

  for (const { i: ia, j: jb } of pairs) {
    while (i < ia) {
      result.push(origin[i])
      i++
    }
    while (j < jb) {
      result.push(extra[j])
      j++
    }
    result.push(origin[ia])
    i = ia + 1
    j = jb + 1
  }

  while (i < n) {
    result.push(origin[i])
    i++
  }
  while (j < m) {
    result.push(extra[j])
    j++
  }

  return result
}
