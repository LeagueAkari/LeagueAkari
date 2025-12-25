/**
 * Generate an integer of range [min, max] or [min, max)
 *
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (exclusive or inclusive)
 * @param inclusive - Whether the max value is inclusive default: false
 * @returns Random integer between min and max
 */
export function randomInt(min: number, max: number, inclusive = false) {
  return Math.floor(Math.random() * (max - min + (inclusive ? 1 : 0))) + min
}

/**
 * 标准正态 CDF Φ(x)
 * Abramowitz & Stegun 7.1.26 近似
 */
function normCdf(x: number): number {
  const p = 0.2316419
  const b1 = 0.31938153
  const b2 = -0.356563782
  const b3 = 1.781477937
  const b4 = -1.821255978
  const b5 = 1.330274429

  const t = 1 / (1 + p * Math.abs(x))
  const poly = ((((b5 * t + b4) * t + b3) * t + b2) * t + b1) * t
  const nd = Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
  const approx = 1 - nd * poly
  return x >= 0 ? approx : 1 - approx
}

/**
 * 标准正态分布反CDF (Probit)
 * Acklam 有理函数近似
 */
function invNorm(p: number): number {
  if (!(p > 0 && p < 1)) {
    if (p === 0) return -Infinity
    if (p === 1) return Infinity
    throw new Error('p must be in (0,1)')
  }

  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2,
    -3.066479806614716e1, 2.506628277459239
  ]
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1,
    -1.328068155288572e1
  ]
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734,
    4.374664141464968, 2.938163982698783
  ]
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416]

  const pl = 0.02425
  const pu = 1 - pl

  let q: number, r: number, x: number

  if (p < pl) {
    q = Math.sqrt(-2 * Math.log(p))
    x =
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    return -x
  } else if (p > pu) {
    q = Math.sqrt(-2 * Math.log(1 - p))
    x =
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    return x
  } else {
    q = p - 0.5
    r = q * q
    x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q
    x = x / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    return x
  }
}

function nextUp(x: number): number {
  if (!Number.isFinite(x)) return x
  if (x === 0) return Number.MIN_VALUE
  const buf = new ArrayBuffer(8)
  const dv = new DataView(buf)
  dv.setFloat64(0, x, false)
  let hi = dv.getUint32(0, false)
  let lo = dv.getUint32(4, false)
  if (x > 0) {
    if (lo === 0xffffffff) {
      lo = 0
      hi += 1
    } else {
      lo += 1
    }
  } else {
    if (lo === 0) {
      lo = 0xffffffff
      hi -= 1
    } else {
      lo -= 1
    }
  }
  dv.setUint32(0, hi, false)
  dv.setUint32(4, lo, false)
  return dv.getFloat64(0, false)
}

export function randomTruncatedNormal(
  a: number,
  b: number,
  mu: number = (a + b) / 2,
  sigma: number = (b - a) / 6
): number {
  if (!(a < b)) throw new Error('Require a < b')
  if (!(sigma > 0)) throw new Error('Require sigma > 0')

  // 标准化边界
  const alpha = (a - mu) / sigma
  const beta = (b - mu) / sigma

  const Phi_alpha = normCdf(alpha)
  const Phi_beta = normCdf(beta)

  const span = Math.max(1e-15, Phi_beta - Phi_alpha)

  // 取 u ∈ (0, 1]，保证左开右闭
  const u = 1 - Math.random()

  const t = Phi_alpha + u * span

  // x = μ + σ * Φ^{-1}(t)
  const z = invNorm(t)
  const x = mu + sigma * z

  if (x <= a) return nextUp(a)
  if (x > b) return b
  return x
}
