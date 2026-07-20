import type { AkariAutoSelectGroup } from '@shared/shards/akari-api'
import { describe, expect, it } from 'vitest'

import { getActiveGroupConfig, getPhaseCalibratedDelayMs } from './computed-state'
import { AutoSelectSettings } from './state'

function createGroup(groupId: string, supportedSgpServers: string[]): AkariAutoSelectGroup {
  return {
    groupId,
    name: { 'zh-CN': groupId, en: groupId },
    iconPath: '/lol-game-data/assets/test.png',
    isCustom: false,
    supportedSgpServers,
    targetGameModes: [{ gameMode: 'CLASSIC', queueTypes: ['NORMAL'] }],
    positions: ['default'],
    additionalPicks: [],
    additionalBans: [],
    excludedPicks: [],
    excludedBans: []
  }
}

describe('getActiveGroupConfig', () => {
  const settings = new AutoSelectSettings()
  const groups = [createGroup('na-only', ['NA1']), createGroup('all-servers', ['*'])]
  const baseArgs = {
    groups,
    gameMode: 'CLASSIC',
    queueType: 'NORMAL',
    isCustomGame: false,
    temporarilyDisabled: false,
    settings,
    leagueServers: { NA1: {}, EUW: {} }
  }

  it.each([
    ['NA1', 'na-only'],
    ['EUW', 'all-servers'],
    ['', 'all-servers'],
    ['UNKNOWN', 'all-servers']
  ])('selects the expected group on SGP server %j', (sgpServerId, expectedGroupId) => {
    expect(getActiveGroupConfig({ ...baseArgs, sgpServerId })?.groupId).toBe(expectedGroupId)
  })

  it('does not activate a restricted group while disconnected', () => {
    expect(
      getActiveGroupConfig({
        ...baseArgs,
        groups: [createGroup('na-only', ['NA1'])],
        sgpServerId: ''
      })
    ).toBeNull()
  })

  it('treats a server missing from League Servers as unknown', () => {
    expect(
      getActiveGroupConfig({
        ...baseArgs,
        groups: [createGroup('stale-only', ['STALE']), createGroup('all-servers', ['*'])],
        sgpServerId: 'STALE'
      })?.groupId
    ).toBe('all-servers')
  })
})

describe('getPhaseCalibratedDelayMs', () => {
  it('uses the configured delay when there is no finite authoritative timer', () => {
    expect(
      getPhaseCalibratedDelayMs({
        configuredDelayMs: 2_000,
        targetOffsetMs: 4_000,
        timer: null
      })
    ).toBe(2_000)
  })

  it('keeps a rearmed timer aligned with the authoritative phase elapsed time', () => {
    expect(
      getPhaseCalibratedDelayMs({
        configuredDelayMs: 2_000,
        targetOffsetMs: 2_000,
        timer: { remainingMs: 28_500, totalMs: 30_000, elapsedMs: 1_500 }
      })
    ).toBe(500)
  })

  it('supports the second delay target for show-and-lock-in', () => {
    expect(
      getPhaseCalibratedDelayMs({
        configuredDelayMs: 2_000,
        targetOffsetMs: 4_000,
        timer: { remainingMs: 27_900, totalMs: 30_000, elapsedMs: 2_100 }
      })
    ).toBe(1_900)
  })

  it('shortens the configured delay to the authoritative remaining time', () => {
    expect(
      getPhaseCalibratedDelayMs({
        configuredDelayMs: 2_000,
        targetOffsetMs: 2_000,
        timer: { remainingMs: 400, totalMs: 30_000, elapsedMs: 1_000 }
      })
    ).toBe(400)
  })

  it('never extends the configured delay', () => {
    expect(
      getPhaseCalibratedDelayMs({
        configuredDelayMs: 2_000,
        targetOffsetMs: 4_000,
        timer: { remainingMs: 30_000, totalMs: 30_000, elapsedMs: 1_000 }
      })
    ).toBe(2_000)
  })

  it('runs immediately once either limit has elapsed', () => {
    expect(
      getPhaseCalibratedDelayMs({
        configuredDelayMs: 2_000,
        targetOffsetMs: 2_000,
        timer: { remainingMs: 25_000, totalMs: 30_000, elapsedMs: 5_000 }
      })
    ).toBe(0)

    expect(
      getPhaseCalibratedDelayMs({
        configuredDelayMs: 2_000,
        targetOffsetMs: 2_000,
        timer: { remainingMs: -100, totalMs: 30_000, elapsedMs: 30_100 }
      })
    ).toBe(0)
  })
})
