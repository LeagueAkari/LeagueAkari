import type { AkariAutoSelectGroup } from '@shared/shards/akari-api'
import { describe, expect, it } from 'vitest'

import { getActiveGroupConfig } from './computed-state'
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
