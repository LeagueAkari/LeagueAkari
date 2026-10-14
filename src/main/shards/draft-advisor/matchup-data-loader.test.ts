import type { ChampionDataPosition } from '@shared/data-adapter/champion-data'
import { describe, expect, it } from 'vitest'

import {
  type DraftChampionBaseData,
  resolveCandidatePool,
  resolveMemberBaseWinRate
} from './matchup-data-loader'

function baseData(input: {
  /** `[英雄, 分路, 该分路胜率, 该分路选取率]` */
  rows: Array<
    [championId: number, position: ChampionDataPosition, winRate: number, pickRate: number]
  >
}): DraftChampionBaseData {
  const winRates = new Map<number, number | null>()
  const roles = new Map<number, ChampionDataPosition | null>()
  const winRatesByPosition = new Map<number, Map<ChampionDataPosition, number | null>>()
  const bestPickRate = new Map<number, number>()

  for (const [championId, position, winRate, pickRate] of input.rows) {
    const byPosition = winRatesByPosition.get(championId) ?? new Map()
    byPosition.set(position, winRate)
    winRatesByPosition.set(championId, byPosition)

    const previous = bestPickRate.get(championId)
    if (previous !== undefined && previous >= pickRate) {
      continue
    }

    bestPickRate.set(championId, pickRate)
    winRates.set(championId, winRate)
    roles.set(championId, position)
  }

  return { winRates, roles, winRatesByPosition }
}

const SAMPLE = baseData({
  rows: [
    // 主位置是中单, 但也有少量辅助记录
    [103, 'middle', 52, 8.5],
    [103, 'utility', 45, 0.4],
    [157, 'middle', 49, 6.1],
    [64, 'jungle', 53, 7.3],
    [86, 'top', 51, 5.2]
  ]
})

describe('draft advisor candidate pool', () => {
  it('keeps only champions that have data in the position being advised', () => {
    const pool = resolveCandidatePool(SAMPLE, 'middle')

    expect(pool.championIds).toEqual([103, 157])
    // 用的是中单那一行的胜率, 不是它的代表胜率
    expect(pool.winRates.get(103)).toBe(52)
    expect(pool.roles.get(103)).toBe('middle')
    expect(pool.winRates.has(64)).toBe(false)
  })

  it('falls back to every champion when the position is unknown', () => {
    const pool = resolveCandidatePool(SAMPLE, null)

    expect([...pool.championIds].sort((left, right) => left - right)).toEqual([64, 86, 103, 157])
    // 代表性胜率取样本最集中的那个分路
    expect(pool.winRates.get(103)).toBe(52)
    expect(pool.roles.get(103)).toBe('middle')
  })

  it('reports an empty pool rather than inventing data for an unplayed position', () => {
    const pool = resolveCandidatePool(SAMPLE, 'bottom')

    expect(pool.championIds).toEqual([])
  })
})

describe('draft advisor member base win rate', () => {
  it('prefers the member own position', () => {
    expect(resolveMemberBaseWinRate(SAMPLE, 103, 'utility')).toBe(45)
  })

  it('falls back to the champion representative value when that position has no record', () => {
    // 64 只有打野记录, 但队友被判成了中路 —— 不能因此把他的胜率丢掉。
    expect(resolveMemberBaseWinRate(SAMPLE, 64, 'middle')).toBe(53)
    expect(resolveMemberBaseWinRate(SAMPLE, 64, null)).toBe(53)
  })

  it('reports nothing for a champion the data source does not cover', () => {
    expect(resolveMemberBaseWinRate(SAMPLE, 999, 'middle')).toBeNull()
  })
})
