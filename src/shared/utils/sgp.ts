export function getSgpServerId(region: string, rsoPlatformId?: string) {
  const r = (region || '').toUpperCase()
  const p = (rsoPlatformId || '').toUpperCase()

  if (!r) {
    return ''
  }

  if (r === 'TENCENT') {
    // `p` is already `(rsoPlatformId || '').toUpperCase()`, so no extra fallback is needed.
    return `TENCENT_${p}`.toUpperCase()
  }

  // Normalize known LCU region codes into SGP config IDs.
  // Built-in SGP config uses IDs like NA1/BR1/OC1/LA1/LA2, while some clients emit NA/BR/OCE/LAN/LAS.
  const aliases: Record<string, string> = {
    NA: 'NA1',
    BR: 'BR1',
    TR: 'TR1',
    LAN: 'LA1',
    LAS: 'LA2',
    OCE: 'OC1',
    EUW1: 'EUW',
    JP1: 'JP'
  }

  return (aliases[r] || r).toUpperCase()
}

export function isTencentServer(sgpServerId: string) {
  return sgpServerId.startsWith('TENCENT')
}
