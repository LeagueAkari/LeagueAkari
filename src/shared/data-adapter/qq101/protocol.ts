import type { Qq101ChampionDataPosition } from '@shared/types/champion-data'

type Qq101NumericInput = string | number | null | undefined

export type Qq101ClassicPosition = 'all' | 'top' | 'jungle' | 'middle' | 'bottom' | 'support'

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
const POSITION_ALIASES: Record<string, string> = {
  TOP: 'TOP',
  上单: 'TOP',
  JUG: 'JUNGLE',
  JUNGLE: 'JUNGLE',
  打野: 'JUNGLE',
  MID: 'MIDDLE',
  MIDDLE: 'MIDDLE',
  中单: 'MIDDLE',
  ADC: 'BOTTOM',
  BOT: 'BOTTOM',
  BOTTOM: 'BOTTOM',
  下路: 'BOTTOM',
  SUP: 'SUPPORT',
  SUPPORT: 'SUPPORT',
  辅助: 'SUPPORT'
}
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
  zj: 8100,
  ws: 8200,
  qd: 8300,
  jj: 8400
}
// Snapshot of the QQ101 rune catalog. IDs are not allocated in style ranges.
const KEYSTONE_STYLES: Record<number, number> = {
  8005: 8000,
  8008: 8000,
  8021: 8000,
  8010: 8000,
  8112: 8100,
  8124: 8100,
  8128: 8100,
  9923: 8100,
  8214: 8200,
  8229: 8200,
  8230: 8200,
  8992: 8200,
  8437: 8400,
  8439: 8400,
  8465: 8400,
  8351: 8300,
  8360: 8300,
  8369: 8300
}

function payloadToString(value: unknown) {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value === 'string') {
    return value
  }

  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

export function extractQq101Field(response: unknown, fieldId = ''): string | null {
  if (typeof response !== 'object' || response === null) {
    return null
  }

  const envelope = response as Qq101Envelope
  const { data } = envelope

  if (typeof data === 'string') {
    return data
  }

  if (data && typeof data === 'object') {
    for (const key of ['result', 'augmentlist', 'championid_data'] as const) {
      const payload = payloadToString(data[key])

      if (payload !== null) {
        return payload
      }
    }

    const fields = data._fieldValues

    if (fields && typeof fields === 'object') {
      if (fieldId) {
        const requested = payloadToString(fields[`R${fieldId}`])

        if (requested !== null) {
          return requested
        }
      }

      const values = Object.values(fields)
      if (values.length === 1) {
        return payloadToString(values[0])
      }

      throw new Error(`QQ101 response is missing an unambiguous field R${fieldId}`)
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

function parseInner<T>(
  response: unknown,
  fieldId = '',
  requiredFields: string[] = []
): (T & { dtstatdate?: string }) | null {
  const payload = extractQq101Field(assertQq101Envelope(response), fieldId)

  if (!payload) {
    return null
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(payload)
  } catch (error) {
    throw new Error('QQ101 returned an invalid embedded JSON payload', { cause: error })
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Expected a QQ101 record object')
  }
  for (const field of requiredFields) {
    if (typeof (parsed as Record<string, unknown>)[field] !== 'string') {
      throw new Error(`QQ101 response is missing record string ${field}`)
    }
  }
  return parsed as T & { dtstatdate?: string }
}

function splitRecords(value: string | undefined, separator: RegExp | string) {
  return (value ?? '').split(separator).filter(Boolean)
}

function rankingRecords(value: unknown, separator: RegExp | string) {
  if (value === undefined) {
    return []
  }
  if (typeof value !== 'string') {
    throw new Error('QQ101 ranking response is missing its record string')
  }

  return splitRecords(value, separator)
}

function toInteger(value: Qq101NumericInput): number | null {
  if (value === undefined || value === null || value === '' || value === '-1') {
    return null
  }

  const parsed = Number(value)

  return Number.isFinite(parsed) ? Math.trunc(parsed) : null
}

function toSignedInteger(value: Qq101NumericInput): number | null {
  if (value === undefined || value === null || value === '') {
    return null
  }

  const parsed = Number(value)

  return Number.isFinite(parsed) ? Math.trunc(parsed) : null
}

function toNumber(value: Qq101NumericInput): number | null {
  if (value === undefined || value === null || value === '' || value === '-1') {
    return null
  }

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

function percentageToRatio(value: Qq101NumericInput) {
  const parsed = toNumber(value)

  return parsed === null ? null : Number((parsed / 100).toFixed(8))
}

function parseRankChange(value: string | undefined) {
  if (!value || value === '未变化') {
    return 0
  }

  const amount = Number(value.match(/\d+/)?.[0])

  if (!Number.isFinite(amount)) {
    return null
  }

  if (value.startsWith('上升')) {
    return amount
  }

  if (value.startsWith('下降')) {
    return -amount
  }

  return null
}

function championIds(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map(toInteger)
    .filter((championId): championId is number => championId !== null && championId > 0)
}

function runeStyleIdForKeystone(keystoneId: number) {
  return KEYSTONE_STYLES[keystoneId] ?? null
}

function recordFields(record: string, separator: string, minimum: number) {
  const fields = record.split(separator)
  if (fields.length < minimum) {
    throw new Error(`QQ101 truncated record: expected at least ${minimum} fields`)
  }
  return fields
}

function parseBuildOptions(value: string | undefined) {
  if (!value || value === '-1') {
    return []
  }

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

  if (!Array.isArray(data)) {
    throw new Error('QQ101 patch list is invalid')
  }

  return data.flatMap((value) => {
    if (typeof value !== 'object' || value === null) {
      return []
    }

    const patch = value as Record<string, unknown>
    const id = Number(patch.id)

    if (!Number.isInteger(id) || typeof patch.name !== 'string') {
      return []
    }

    return [{ id, name: patch.name }]
  })
}

export function parseQq101TierList(response: unknown, patch: string) {
  const payload = parseInner<{ dtstatdate?: string; datadetails?: string }>(response, '17960', [
    'datadetails'
  ])
  const champions = rankingRecords(payload?.datadetails, '#').flatMap((record) => {
    const fields = recordFields(record, '_', 9)
    const championId = toInteger(fields[1])

    if (championId === null) {
      return []
    }

    return [
      {
        rank: toInteger(fields[0]),
        championId,
        rowKey: `${championId}:${fields[3]}`,
        strengthTier: fields[2] ?? '',
        position: fields[3] ?? 'NONE',
        winRate: percentageToRatio(fields[4]),
        pickRate: percentageToRatio(fields[5]),
        banRate: percentageToRatio(fields[6]),
        counterChampionIds: championIds(fields[7]),
        rankChange: toSignedInteger(fields[8]),
        dailyAverageSurge: toNumber(fields[9]),
        isHot: fields[10] === '1'
      }
    ]
  })

  return { date: payload?.dtstatdate ?? '', patch, champions }
}

export function parseQq101ClassicTierList(
  response: unknown,
  position: Qq101ClassicPosition = 'all'
) {
  const payload = parseInner<{ dtstatdate?: string; tierscore_top_hero_list?: string }>(
    response,
    '18009',
    ['tierscore_top_hero_list']
  )
  const champions = rankingRecords(payload?.tierscore_top_hero_list, '#').flatMap((record) => {
    const fields = recordFields(record, '|', 7)
    const classicChampionId = toInteger(fields[1])

    if (classicChampionId === null) {
      return []
    }

    // 经典模式资源使用 60000 + 原英雄 ID，例如 60081 对应伊泽瑞尔 (81)。
    const championId = classicChampionId >= 60000 ? classicChampionId - 60000 : classicChampionId

    if (championId <= 0) {
      return []
    }

    return [
      {
        rank: toInteger(fields[0]),
        championId,
        classicChampionId,
        strengthTier: fields[5] ?? '',
        position: position.toUpperCase(),
        winRate: percentageToRatio(fields[2]),
        pickRate: percentageToRatio(fields[3]),
        banRate: percentageToRatio(fields[4]),
        counterChampionIds: [],
        rankChange: toSignedInteger(fields[6])
      }
    ]
  })

  return { date: payload?.dtstatdate ?? '', champions }
}

export function parseQq101Trend(response: unknown, championId: number) {
  const payload = parseInner<{ history_strength_trend?: string }>(response, '17987', [
    'history_strength_trend'
  ])
  const points = splitRecords(payload?.history_strength_trend, '#').flatMap((record) => {
    const [patch, rawWinRate] = record.split('_')
    const winRate = percentageToRatio(rawWinRate)

    return patch && winRate !== null ? [{ patch, winRate }] : []
  })

  return { championId, date: payload?.dtstatdate ?? '', points }
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
    '17968',
    ['high_op_details', 'low_op_details']
  )

  return {
    championId,
    favorable: parseMatchups(payload?.high_op_details),
    date: payload?.dtstatdate ?? '',
    unfavorable: parseMatchups(payload?.low_op_details)
  }
}

export function parseQq101Synergies(response: unknown, championId: number) {
  const payload = parseInner<{ data_details?: string }>(response, '18015', ['data_details'])
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

  return { championId, date: payload?.dtstatdate ?? '', synergies }
}

export function parseQq101SummonerSpells(response: unknown, championId: number) {
  const payload = parseInner<{ data_details?: string }>(response, '18029', ['data_details'])
  const recommendations = splitRecords(payload?.data_details, '#')
    .flatMap((record) => {
      const fields = record.split('_')
      let firstId = toInteger(fields[0])
      let secondId = toInteger(fields[1])

      if (firstId === null || secondId === null) {
        return []
      }

      if (secondId === 4 && firstId !== 4) {
        ;[firstId, secondId] = [secondId, firstId]
      }

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

  return { championId, date: payload?.dtstatdate ?? '', recommendations }
}

export function parseQq101SkillOrder(response: unknown, championId: number) {
  const payload = parseInner<{ detaildetails?: string }>(response, '18070', ['detaildetails'])
  const priorities: Array<{
    abilityCodes: number[]
    pickRate: number | null
    winRate: number | null
  }> = []
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

    if (header.length < 3) {
      continue
    }

    const currentPriority = (header[0] ?? '').split(',').filter(Boolean).map(abilityKey)
    priorities.push({
      abilityCodes: header[0].split(',').map(Number),
      pickRate: percentageToRatio(header[1]),
      winRate: percentageToRatio(header[2])
    })

    if (abilityPriority.length === 0) {
      abilityPriority = currentPriority
    }

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

      if (primaryLevelOrder.length === 0 && levelOrder.length > 0) {
        primaryLevelOrder.push(...levelOrder)
      }
    }
  }

  return {
    championId,
    date: payload?.dtstatdate ?? '',
    priorities,
    abilityPriority,
    levelOrder: primaryLevelOrder,
    options
  }
}

export function parseQq101TierStats(response: unknown, championId: number) {
  const payload = parseInner<{ datadetails?: string }>(response, '18059', ['datadetails'])
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

  return { championId, date: payload?.dtstatdate ?? '', tiers }
}

export function parseQq101Build(response: unknown, championId: number) {
  const payload = parseInner<Record<string, string>>(response, '18087', [
    'starting_details',
    'shoes_details',
    'core_details',
    'forth_details',
    'fifth_details',
    'sixth_details'
  ])

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
  if (payload && typeof primaryText !== 'string') {
    throw new Error('QQ101 missing rune page record string')
  }
  const pages =
    !primaryText || primaryText === '-1'
      ? []
      : splitRecords(primaryText, '#').flatMap((record) => {
          const fields = record.split('_')
          const keystoneId = toInteger(fields[1])

          if (fields.length < 7 || keystoneId === null) {
            return []
          }

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

  pages.sort((left, right) => left.rank - right.rank)
  return { championId, date: payload?.dtstatdate ?? '', pages }
}

export function parseQq101Positions(response: unknown, championId: number) {
  const payload = parseInner<Record<string, string>>(response, '18122')
  const records = payload?.data_details ?? payload?.lane_details ?? payload?.details
  if (payload && typeof records !== 'string') {
    throw new Error('QQ101 missing position record string')
  }
  const positions = splitRecords(records, '#').flatMap((record) => {
    const separator = record.includes('：') ? record.indexOf('：') : record.indexOf(':')

    const fields = record
      .slice(separator + 1)
      .trim()
      .split('_')
    const position = separator < 0 ? fields.shift()!.trim() : record.slice(0, separator).trim()
    if (!position || fields.length < 5) {
      throw new Error('QQ101 truncated position record')
    }
    const rank = toInteger(fields[4])

    return [
      {
        position: POSITION_ALIASES[position.toUpperCase()] ?? position,
        pickRate: percentageToRatio(fields[0]),
        winRate: percentageToRatio(fields[1]),
        banRate: percentageToRatio(fields[2]),
        strengthTier: fields[3] || null,
        rank: fields.length >= 7 && !rank ? toInteger(fields[5]) : rank,
        share: percentageToRatio(fields.length >= 7 ? fields[6] : fields[5])
      }
    ]
  })

  return { championId, date: payload?.dtstatdate ?? '', positions }
}

export function parseQq101Durations(response: unknown, championId: number) {
  const payload = parseInner<{ data_details?: string }>(response, '18057', ['data_details'])
  const durations = splitRecords(payload?.data_details, '#').flatMap((record) => {
    const fields = record.split('_')
    const rangeId = toInteger(fields[0])
    const winRate = percentageToRatio(fields[1])

    return rangeId === null || winRate === null
      ? []
      : [
          {
            rangeId,
            range: DURATION_RANGES[rangeId] ?? `Range ${rangeId}`,
            winRate,
            rank: toInteger(fields[2])
          }
        ]
  })

  return { championId, date: payload?.dtstatdate ?? '', durations }
}

function parseAramChampionRecords(value: string | undefined, includeAugments: boolean) {
  return rankingRecords(value, /[#|]/).flatMap((record) => {
    const fields = recordFields(record, '_', includeAugments ? 11 : 10)
    const championId = toInteger(fields[0])

    if (championId === null) {
      return []
    }

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
  const payload = parseInner<{ listcollect?: string }>(response, '15380', ['listcollect'])

  return { date, champions: parseAramChampionRecords(payload?.listcollect, true) }
}

export function parseQq101AramChampions(response: unknown, date: string) {
  const payload = parseInner<{ listcollect?: string }>(response, '6993', ['listcollect'])

  return { date, champions: parseAramChampionRecords(payload?.listcollect, false) }
}

export function parseQq101MayhemAugments(response: unknown, _requestedDate?: string) {
  const payload = parseInner<{ dtstatdate?: string; augmentlist?: string }>(response, '15381', [
    'augmentlist'
  ])
  const augments = rankingRecords(payload?.augmentlist, /[#|]/).flatMap((record) => {
    const fields = recordFields(record, '_', 9)
    const augmentId = toInteger(fields[0])

    if (augmentId === null) {
      return []
    }

    return [
      {
        augmentId,
        // 255 describes the all-quality query, not the augment's actual rarity.
        // Resolve missing rarity from the augment catalog in the presentation layer.
        augmentTier: fields[1] === '255' ? null : toInteger(fields[1]),
        pickRate: toNumber(fields[2]),
        pickRank: toInteger(fields[3]),
        pickRankChange: toSignedInteger(fields[4]),
        pickRankImprovement: toSignedInteger(fields[4]) === null ? null : -Number(fields[4]),
        winRate: toNumber(fields[5]),
        winRank: toInteger(fields[6]),
        winRankChange: toSignedInteger(fields[7]),
        winRankImprovement: toSignedInteger(fields[7]) === null ? null : -Number(fields[7]),
        bestChampions: championIds(fields[8]).map((championId) => ({ championId }))
      }
    ]
  })

  return { date: payload?.dtstatdate ?? '', augments }
}

export function parseQq101MayhemPairSynergies(response: unknown) {
  const payload = parseInner<{ championid_data?: string; dtstatdate?: string }>(response, '15323', [
    'championid_data'
  ])
  const synergies = rankingRecords(payload?.championid_data, '#').flatMap((record) => {
    const fields = recordFields(record, '|', 5)
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

export function toQq101Position(position: Qq101ChampionDataPosition | undefined) {
  const positions: Record<Qq101ChampionDataPosition, string> = {
    all: 'ALL',
    top: 'TOP',
    jungle: 'JUNGLE',
    middle: 'MIDDLE',
    bottom: 'BOTTOM',
    utility: 'SUPPORT'
  }

  return positions[position ?? 'all']
}

export function parseQq101ClassicLanes(response: unknown) {
  const payload = parseInner<{ dtstatdate?: string; hero_lane_list: string }>(response, '18037', [
    'hero_lane_list'
  ])
  const champions = splitRecords(payload?.hero_lane_list, '#').map((record) => {
    const [id, lanes] = recordFields(record, '_', 2)
    return { classicChampionId: Number(id), positions: lanes.split(';') }
  })
  return { date: payload?.dtstatdate ?? '', champions }
}

export function parseQq101JungleRoutes(response: unknown, championId: number) {
  const payload = parseInner<{ dtstatdate?: string; data_details: string }>(response, '18782', [
    'data_details'
  ])
  const groups = splitRecords(payload?.data_details, '$').map((group) => {
    const match = /^([^*]+)\*(100|200):\[(.*)\]$/.exec(group)
    if (!match) {
      throw new Error('QQ101 invalid jungle route group')
    }
    const routes = splitRecords(match[3], '#')
      .map((record) => {
        const fields = recordFields(record, '_', 5)
        return {
          rank: toInteger(fields[0]),
          camps: fields[1].split(','),
          games: toInteger(fields[2]),
          pickRate: percentageToRatio(fields[3]),
          winRate: percentageToRatio(fields[4])
        }
      })
      .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity))
    return { startingCamp: match[1] === '255' ? null : match[1], teamId: Number(match[2]), routes }
  })
  return { championId, date: payload?.dtstatdate ?? '', groups }
}

export function parseQq101MayhemDetails(response: unknown, championId: number) {
  const payload = parseInner<Record<string, string>>(response, '15318')
  if (!payload) {
    return null
  }
  if (typeof payload.augment_json_irank !== 'string' && typeof payload.augment_json !== 'string') {
    throw new Error('QQ101 missing hero augment recommendations')
  }

  const parseAugments = (text: string | undefined) =>
    splitRecords(text, '&').flatMap((group) => {
      const colon = group.indexOf(':')
      const quality = colon < 0 ? '255' : group.slice(0, colon)
      return splitRecords(group.slice(colon + 1), '#').map((record) => {
        const fields = recordFields(record, '|', 5)
        return {
          rank: toInteger(fields[0]),
          championId: Number(fields[1]),
          augmentId: Number(fields[2]),
          quality: quality === '255' ? null : quality,
          pickRate: toNumber(fields[4]),
          grade: fields[5] || null
        }
      })
    })
  const parseItems = (text: string | undefined) =>
    splitRecords(text, '#').map((record) => {
      const fields = recordFields(record, '$', 3)
      return {
        itemIds: championIds(fields[0]),
        pickRate: toNumber(fields[1]),
        winRate: toNumber(fields[2])
      }
    })
  const parseNested = (text: string | undefined): Record<string, Record<string, unknown>> => {
    if (!text || text === '-1') {
      return {}
    }
    const result = JSON.parse(text)
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
      throw new Error('QQ101 invalid nested hero details')
    }
    return result
  }
  const basisPoints = (value: unknown) => {
    const number = toNumber(
      typeof value === 'string' || typeof value === 'number' ? value : undefined
    )
    return number === null ? null : number / 10000
  }
  const parseNestedItems = (text: string | undefined, key: string) =>
    Object.entries(parseNested(text))
      .map(([rank, row]) => ({
        rank: Number(rank),
        itemIds: String(row[key] ?? '')
          .split('&')
          .map(Number),
        pickRate: basisPoints(row.showrate),
        winRate: basisPoints(row.winrate)
      }))
      .sort((a, b) => a.rank - b.rank)
  const skillOrders = Object.entries(parseNested(payload.skill_json))
    .map(([rank, row]) => ({
      rank: Number(rank),
      abilityCodes: String(row.qwe ?? '')
        .split('&')
        .map(Number),
      pickRate: basisPoints(row.qwe_s),
      winRate: basisPoints(row.qwe_w),
      plans: Object.entries((row.sks ?? {}) as Record<string, Record<string, unknown>>)
        .map(([planRank, plan]) => ({
          rank: Number(planRank),
          abilityCodes: String(plan.sk ?? '')
            .split('&')
            .map(Number),
          pickRate: basisPoints(plan.sk_s),
          winRate: basisPoints(plan.sk_w)
        }))
        .sort((a, b) => a.rank - b.rank)
    }))
    .sort((a, b) => a.rank - b.rank)

  return {
    championId,
    date: payload.dtstatdate ?? '',
    augments: parseAugments(payload.augment_json_irank),
    augmentsByQuality: parseAugments(payload.augment_json),
    starting: parseItems(payload.itemout),
    boots: parseItems(payload.itemshoes),
    items: parseNestedItems(payload.itemone_json, 'itemone'),
    core: parseNestedItems(payload.itemcore_json, 'itemcore'),
    builds: splitRecords(payload.itemover_rec, ';').map((record) => {
      const fields = recordFields(record, '_', 4)
      return {
        rank: toInteger(fields[0]),
        itemIds: championIds(fields[1]),
        pickRate: toNumber(fields[2]),
        winRate: toNumber(fields[3])
      }
    }),
    partners: splitRecords(payload.championid_json, '#').map((record) => {
      const fields = recordFields(record, '|', 4)
      return {
        championId: Number(fields[0]),
        winRate: toNumber(fields[1]),
        pickRate: toNumber(fields[2]),
        rank: toInteger(fields[3])
      }
    }),
    skillOrders
  }
}

export function toQq101ClassicPosition(
  position: Qq101ChampionDataPosition | undefined
): Qq101ClassicPosition {
  const positions: Record<Qq101ChampionDataPosition, Qq101ClassicPosition> = {
    all: 'all',
    top: 'top',
    jungle: 'jungle',
    middle: 'middle',
    bottom: 'bottom',
    utility: 'support'
  }

  return positions[position ?? 'all']
}
