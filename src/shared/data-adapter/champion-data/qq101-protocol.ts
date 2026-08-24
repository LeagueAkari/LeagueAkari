import type { ChampionDataPosition } from './types'

type NumericInput = string | number | null | undefined

interface Qq101Envelope {
  code?: number
  result?: unknown
  data?:
    | string
    | {
        result?: unknown
        augmentlist?: unknown
        championid_data?: unknown
        _fieldValues?: Record<string, unknown>
        [key: string]: unknown
      }
  [key: string]: unknown
}

const ABILITY_KEYS: Record<number, string> = { 1: 'Q', 2: 'W', 3: 'E', 4: 'R' }
const DURATION_RANGES: Record<number, string> = {
  1: '<20 min',
  2: '20-25 min',
  3: '25-30 min',
  4: '30-35 min',
  5: '35-40 min',
  6: '40+ min'
}
const RUNE_STYLE_BY_CODE: Record<string, number> = {
  jm: 8000,
  zz: 8100,
  ws: 8200,
  qd: 8300,
  jj: 8400
}
const KEYSTONE_STYLE_RANGES: Array<[number, number, number]> = [
  [8000, 8099, 8000],
  [8100, 8199, 8100],
  [8200, 8299, 8200],
  [8300, 8399, 8300],
  [8400, 8499, 8400]
]

function payloadToString(value: unknown) {
  if (value === undefined || value === null) return null
  if (typeof value === 'string') return value
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

export function extractQq101Field(response: unknown, fieldId = ''): string | null {
  if (typeof response !== 'object' || response === null) return null
  const envelope = response as Qq101Envelope
  const { data } = envelope

  if (typeof data === 'string') return data
  if (data && typeof data === 'object') {
    for (const key of ['result', 'augmentlist', 'championid_data'] as const) {
      const payload = payloadToString(data[key])
      if (payload !== null) return payload
    }

    const fields = data._fieldValues
    if (fields && typeof fields === 'object') {
      if (fieldId) {
        const requested = payloadToString(fields[`R${fieldId}`])
        if (requested !== null) return requested
      }
      return payloadToString(Object.values(fields)[0])
    }
  }

  return payloadToString(envelope.result)
}

export function assertQq101Envelope(response: unknown) {
  if (typeof response !== 'object' || response === null || (response as Qq101Envelope).code !== 0) {
    throw new Error(`QQ101 upstream returned an error: ${JSON.stringify(response).slice(0, 300)}`)
  }
  return response
}

function parseInner<T>(response: unknown, fieldId = ''): T | null {
  const payload = extractQq101Field(assertQq101Envelope(response), fieldId)
  if (!payload) return null
  try {
    return JSON.parse(payload) as T
  } catch (error) {
    throw new Error('QQ101 returned an invalid embedded JSON payload', { cause: error })
  }
}

function splitRecords(value: string | undefined, separator: RegExp | string) {
  return (value ?? '').split(separator).filter(Boolean)
}

function toInteger(value: NumericInput): number | null {
  if (value === undefined || value === null || value === '' || value === '-1') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null
}

function toNumber(value: NumericInput): number | null {
  if (value === undefined || value === null || value === '' || value === '-1') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function percentageToRatio(value: NumericInput) {
  const parsed = toNumber(value)
  return parsed === null ? null : Number((parsed / 100).toFixed(8))
}

function parseRankChange(value: string | undefined) {
  if (!value || value === '未变化') return 0
  const amount = Number(value.match(/\d+/)?.[0])
  if (!Number.isFinite(amount)) return null
  if (value.startsWith('上升')) return amount
  if (value.startsWith('下降')) return -amount
  return null
}

function championIds(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map(toInteger)
    .filter((championId): championId is number => championId !== null && championId > 0)
}

function runeStyleIdForKeystone(keystoneId: number) {
  return (
    KEYSTONE_STYLE_RANGES.find(([start, end]) => keystoneId >= start && keystoneId <= end)?.[2] ??
    null
  )
}

function parseBuildOptions(value: string | undefined) {
  if (!value || value === '-1') return []
  return splitRecords(value, '#').map((record) => {
    const fields = record.split('_')
    return {
      itemIds: (fields[0] ?? '')
        .split(',')
        .map(toInteger)
        .filter((id): id is number => id !== null),
      rank: toInteger(fields[1]),
      pickRate: percentageToRatio(fields[2]),
      winRate: percentageToRatio(fields[3])
    }
  })
}

export function parseQq101Patches(response: unknown) {
  assertQq101Envelope(response)
  const data = (response as { data?: unknown }).data
  if (!Array.isArray(data)) throw new Error('QQ101 patch list is invalid')
  return data.flatMap((value) => {
    if (typeof value !== 'object' || value === null) return []
    const patch = value as Record<string, unknown>
    const id = Number(patch.id)
    if (!Number.isInteger(id) || typeof patch.name !== 'string') return []
    return [{ id, name: patch.name }]
  })
}

export function parseQq101TierList(response: unknown, patch: string) {
  const payload = parseInner<{ dtstatdate?: string; datadetails?: string }>(response, '17960')
  const champions = splitRecords(payload?.datadetails, '#').flatMap((record) => {
    const fields = record.split('_')
    const championId = toInteger(fields[1])
    if (championId === null) return []
    return [
      {
        rank: toInteger(fields[0]),
        championId,
        strengthTier: fields[2] ?? '',
        position: fields[3] ?? 'NONE',
        winRate: percentageToRatio(fields[4]),
        pickRate: percentageToRatio(fields[5]),
        banRate: percentageToRatio(fields[6]),
        counterChampionIds: championIds(fields[7]),
        rankChange: toInteger(fields[8])
      }
    ]
  })
  return { date: payload?.dtstatdate ?? '', patch, champions }
}

export function parseQq101Trend(response: unknown, championId: number) {
  const payload = parseInner<{ history_strength_trend?: string }>(response, '17987')
  const points = splitRecords(payload?.history_strength_trend, '#').flatMap((record) => {
    const [patch, rawWinRate] = record.split('_')
    const winRate = percentageToRatio(rawWinRate)
    return patch && winRate !== null ? [{ patch, winRate }] : []
  })
  return { championId, points }
}

function parseMatchups(value: string | undefined) {
  return splitRecords(value, '#').flatMap((record) => {
    const fields = record.split('_')
    const championId = toInteger(fields[1])
    return championId === null ? [] : [{ championId, winRate: percentageToRatio(fields[2]) }]
  })
}

export function parseQq101Matchups(response: unknown, championId: number) {
  const payload = parseInner<{ high_op_details?: string; low_op_details?: string }>(
    response,
    '17968'
  )
  return {
    championId,
    favorable: parseMatchups(payload?.high_op_details),
    unfavorable: parseMatchups(payload?.low_op_details)
  }
}

export function parseQq101Synergies(response: unknown, championId: number) {
  const payload = parseInner<{ data_details?: string }>(response, '18015')
  const synergies = splitRecords(payload?.data_details, '#').flatMap((record) => {
    const fields = record.split('_')
    const partnerChampionId = toInteger(fields[1])
    return partnerChampionId === null
      ? []
      : [
          {
            championId: partnerChampionId,
            winRate: percentageToRatio(fields[2]),
            games: toInteger(fields[3])
          }
        ]
  })
  return { championId, synergies }
}

export function parseQq101SummonerSpells(response: unknown, championId: number) {
  const payload = parseInner<{ data_details?: string }>(response, '18029')
  const recommendations = splitRecords(payload?.data_details, '#')
    .flatMap((record) => {
      const fields = record.split('_')
      let firstId = toInteger(fields[0])
      let secondId = toInteger(fields[1])
      if (firstId === null || secondId === null) return []
      if (secondId === 4 && firstId !== 4) [firstId, secondId] = [secondId, firstId]
      return [
        {
          rank: 0,
          summonerSpellIds: [firstId, secondId],
          winRate: percentageToRatio(fields[2]),
          pickRate: percentageToRatio(fields[3])
        }
      ]
    })
    .sort((left, right) => (right.pickRate ?? 0) - (left.pickRate ?? 0))
    .slice(0, 5)
    .map((item, index) => ({ ...item, rank: index + 1 }))
  return { championId, recommendations }
}

export function parseQq101SkillOrder(response: unknown, championId: number) {
  const payload = parseInner<{ detaildetails?: string }>(response, '18070')
  const options: Array<{
    abilityPriority: string[]
    pickRate: number | null
    winRate: number | null
    levelOrder: string[]
  }> = []
  const primaryLevelOrder: string[] = []
  let abilityPriority: string[] = []
  const abilityKey = (value: string) => ABILITY_KEYS[Number(value)] ?? value

  for (const segment of splitRecords(payload?.detaildetails, '$')) {
    const parts = splitRecords(segment, '@')
    const header = parts[0]?.split(':') ?? []
    if (header.length < 3) continue
    const currentPriority = (header[0] ?? '').split(',').filter(Boolean).map(abilityKey)
    if (abilityPriority.length === 0) abilityPriority = currentPriority
    if (parts.length === 1) {
      options.push({
        abilityPriority: currentPriority,
        pickRate: percentageToRatio(header[1]),
        winRate: percentageToRatio(header[2]),
        levelOrder: []
      })
      continue
    }
    for (const detail of parts.slice(1)) {
      const fields = detail.split('_')
      const levelOrder = (fields[0] ?? '').split(',').filter(Boolean).map(abilityKey)
      options.push({
        abilityPriority: currentPriority,
        pickRate: percentageToRatio(fields[1] ?? header[1]),
        winRate: percentageToRatio(fields[2] ?? header[2]),
        levelOrder
      })
      if (primaryLevelOrder.length === 0 && levelOrder.length > 0)
        primaryLevelOrder.push(...levelOrder)
    }
  }
  return { championId, abilityPriority, levelOrder: primaryLevelOrder, options }
}

export function parseQq101TierStats(response: unknown, championId: number) {
  const payload = parseInner<{ datadetails?: string }>(response, '18059')
  const tiers = splitRecords(payload?.datadetails, '#').flatMap((record) => {
    const fields = record.split('_')
    const tierId = toInteger(fields[0])
    return tierId === null
      ? []
      : [
          {
            tierId,
            winRate: percentageToRatio(fields[1]),
            pickRate: percentageToRatio(fields[2]),
            banRate: percentageToRatio(fields[3])
          }
        ]
  })
  return { championId, tiers }
}

export function parseQq101Build(response: unknown, championId: number) {
  const payload = parseInner<Record<string, string>>(response, '18087')
  return {
    championId,
    date: payload?.dtstatdate ?? '',
    slots: {
      starting: parseBuildOptions(payload?.starting_details),
      boots: parseBuildOptions(payload?.shoes_details),
      core: parseBuildOptions(payload?.core_details),
      fourth: parseBuildOptions(payload?.forth_details),
      fifth: parseBuildOptions(payload?.fifth_details),
      sixth: parseBuildOptions(payload?.sixth_details)
    }
  }
}

export function parseQq101Runes(response: unknown, championId: number) {
  const payload = parseInner<Record<string, string>>(response, '18119')
  const primaryText = payload?.rune_top_details ?? payload?.top_details ?? payload?.rune_details
  const pages =
    !primaryText || primaryText === '-1'
      ? []
      : splitRecords(primaryText, '#').flatMap((record) => {
          const fields = record.split('_')
          const keystoneId = toInteger(fields[1])
          if (fields.length < 7 || keystoneId === null) return []
          const runeIds = (fields[3] ?? '').split(',').map(toInteger)
          return [
            {
              rank: toInteger(fields[0]) ?? 1,
              primaryStyleId: runeStyleIdForKeystone(keystoneId),
              secondaryStyleId: RUNE_STYLE_BY_CODE[fields[2]] ?? null,
              primaryRuneIds: runeIds.slice(0, 4).filter((id): id is number => id !== null),
              secondaryRuneIds: runeIds.slice(4, 6).filter((id): id is number => id !== null),
              statShardIds: runeIds.slice(6, 9).filter((id): id is number => id !== null),
              pickRate: percentageToRatio(fields[4]),
              winRate: percentageToRatio(fields[5]),
              games: toInteger(fields[6]) ?? 0
            }
          ]
        })
  return { championId, pages }
}

export function parseQq101Positions(response: unknown, championId: number) {
  const payload = parseInner<{ lane_details?: string }>(response, '18122')
  const positions = splitRecords(payload?.lane_details, '#').flatMap((record) => {
    const separator = record.includes('：') ? record.indexOf('：') : record.indexOf(':')
    if (separator < 0) return []
    const fields = record
      .slice(separator + 1)
      .trim()
      .split('_')
    return [
      {
        position: record.slice(0, separator).trim(),
        pickRate: percentageToRatio(fields[0]),
        winRate: percentageToRatio(fields[1]),
        banRate: percentageToRatio(fields[2]),
        strengthTier: fields[3] || 'T2',
        rank: toInteger(fields[4]),
        share: percentageToRatio(fields[5])
      }
    ]
  })
  return { championId, positions }
}

export function parseQq101Durations(response: unknown, championId: number) {
  const payload = parseInner<{ data_details?: string }>(response, '18057')
  const durations = splitRecords(payload?.data_details, '#').flatMap((record) => {
    const fields = record.split('_')
    const rangeId = toInteger(fields[0])
    const winRate = percentageToRatio(fields[1])
    return rangeId === null || winRate === null
      ? []
      : [
          {
            range: DURATION_RANGES[rangeId] ?? `Range ${rangeId}`,
            winRate,
            rank: toInteger(fields[2])
          }
        ]
  })
  return { championId, durations }
}

function parseMayhemChampionRecords(value: string | undefined, includeAugments: boolean) {
  return splitRecords(value, /[#|]/).flatMap((record) => {
    const fields = record.split('_')
    const championId = toInteger(fields[0])
    if (championId === null) return []
    const bestPartners = (fields[5] ?? '')
      .split('&')
      .filter(Boolean)
      .flatMap((partner) => {
        const values = partner.split(',')
        const partnerId = toInteger(values[0])
        return partnerId === null
          ? []
          : [
              {
                championId: partnerId,
                pickRate: toNumber(values[1]),
                winRate: toNumber(values[2]),
                rank: toInteger(values[3])
              }
            ]
      })
    return [
      {
        championId,
        rank: toInteger(fields[1]),
        rankChange: parseRankChange(fields[2]),
        winRate: toNumber(fields[3]),
        pickRate: toNumber(fields[4]),
        bestPartners,
        averageDeathTimeSeconds: toNumber(fields[6]),
        killParticipationRate: toNumber(fields[7]),
        damageShare: toNumber(fields[8]),
        damageTakenShare: toNumber(fields[9]),
        ...(includeAugments
          ? {
              lowestRankAugmentIds: (fields[10] ?? '')
                .split(',')
                .map(toInteger)
                .filter((id): id is number => id !== null)
            }
          : {})
      }
    ]
  })
}

export function parseQq101MayhemChampions(response: unknown, date: string) {
  const payload = parseInner<{ listcollect?: string }>(response, '15380')
  return { date, champions: parseMayhemChampionRecords(payload?.listcollect, true) }
}

export function parseQq101MayhemAugments(response: unknown, date: string) {
  const payload = parseInner<{ augmentlist?: string }>(response, '15332')
  const augments = splitRecords(payload?.augmentlist, /[#|]/).flatMap((record) => {
    const fields = record.split('_')
    const augmentId = toInteger(fields[0])
    if (augmentId === null) return []
    return [
      {
        augmentId,
        augmentTier: toInteger(fields[1]),
        pickRate: toNumber(fields[2]),
        pickRank: toInteger(fields[3]),
        pickRankChange: toInteger(fields[4]),
        winRate: toNumber(fields[5]),
        winRank: toInteger(fields[6]),
        winRankChange: toInteger(fields[7]),
        bestChampions: championIds(fields[8]).map((championId) => ({ championId }))
      }
    ]
  })
  return { date, augments }
}

export function parseQq101MayhemPairSynergies(response: unknown) {
  const payload = parseInner<{ championid_data?: string; dtstatdate?: string }>(response, '15323')
  const synergies = splitRecords(payload?.championid_data, '#').flatMap((record) => {
    const fields = record.split('|')
    const ids = (fields[0] ?? '').split(';').map(toInteger)
    const champions = ids
      .filter((id): id is number => id !== null)
      .map((championId) => ({ championId }))
    return champions.length !== 2
      ? []
      : [
          {
            champions,
            winRate: toNumber(fields[2]),
            pickRate: toNumber(fields[3]),
            rank: toInteger(fields[4])
          }
        ]
  })
  return { date: payload?.dtstatdate ?? '', synergies }
}

export function toQq101Position(position: ChampionDataPosition | undefined) {
  const positions: Record<ChampionDataPosition, string> = {
    all: 'ALL',
    top: 'TOP',
    jungle: 'JUNGLE',
    middle: 'MIDDLE',
    bottom: 'BOTTOM',
    utility: 'SUPPORT',
    none: 'ALL'
  }
  return positions[position ?? 'all']
}

export function toQq101Tier(tier: string | number | undefined) {
  if (typeof tier === 'number') return tier
  const tiers: Record<string, number> = {
    all: 255,
    ibsg: 4,
    gold_plus: 24,
    platinum_plus: 25,
    emerald_plus: 26,
    diamond_plus: 27,
    master: 8,
    master_plus: 28,
    grandmaster: 9,
    challenger: 10
  }
  return tiers[tier ?? 'emerald_plus'] ?? 26
}
