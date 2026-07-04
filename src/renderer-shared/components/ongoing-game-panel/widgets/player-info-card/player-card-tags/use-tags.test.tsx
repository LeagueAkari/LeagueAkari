import { createDefaultOngoingGamePanelPlayerCardTagSettings } from '@shared/shards/ongoing-game/settings'
import type { SavedInfo } from '@shared/shards/saved-player'
import { describe, expect, it } from 'vitest'
import { computed, isVNode } from 'vue'

import { PLAYER_CARD_TAGS } from './tags'
import type { PlayerCardTagContext } from './types'
import { usePlayerCardTags } from './use-tags'

const createAnalysis = () =>
  ({
    akariScore: {
      total: 4.23,
      outstanding: true,
      extraordinary: false
    }
  }) as PlayerCardTagContext['analysis']

const createContext = (
  overrides: Partial<PlayerCardTagContext> & { selfPuuid?: string } = {}
): PlayerCardTagContext =>
  ({
    puuid: 'player-1',
    selfPuuid: 'player-2',
    settings: createDefaultOngoingGamePanelPlayerCardTagSettings(),
    analysis: null,
    summoners: {},
    savedInfo: null,
    premadeTeamId: undefined,
    positionAssignment: undefined,
    spells: undefined,
    cachedGames: {},
    locale: 'zh-CN',
    t: ((key: string) => key) as PlayerCardTagContext['t'],
    masked: (text: string) => text,
    navigateToSummonerByPuuid: () => {},
    previewEncounteredGame: () => {},
    ...overrides
  }) as PlayerCardTagContext

const createSavedInfo = (overrides: Partial<SavedInfo> = {}): SavedInfo => ({
  puuid: 'player-1',
  selfPuuid: 'player-2',
  region: 'NA',
  rsoPlatformId: 'NA1',
  tag: null,
  updateAt: new Date(0),
  lastMetAt: null,
  tags: [],
  encounteredGames: {
    data: [],
    page: 1,
    pageSize: 5,
    total: 0
  },
  ...overrides
})

describe('PLAYER_CARD_TAGS', () => {
  it('exports known tags with unique ids and render factories only', () => {
    const ids = PLAYER_CARD_TAGS.map((tag) => tag.id)
    expect(new Set(ids).size).toBe(ids.length)

    for (const tag of PLAYER_CARD_TAGS) {
      expect(Object.keys(tag).sort()).toEqual(['id', 'render'].sort())
      expect(typeof tag.id).toBe('string')
      expect(tag.id.length).toBeGreaterThan(0)
      expect(typeof tag.render).toBe('function')
      expect('settingKey' in tag).toBe(false)
    }
  })

  it('uses null render results as the single gate for user settings and runtime conditions', () => {
    const selfTag = PLAYER_CARD_TAGS.find((tag) => tag.id === 'self')
    expect(selfTag).toBeDefined()

    const enabledContext = createContext({ selfPuuid: 'player-1' })
    const rendered = selfTag!.render(enabledContext)
    expect(rendered).not.toBeNull()
    expect(isVNode(rendered!.label)).toBe(true)
    expect(rendered!.popover).toBeUndefined()

    const disabledContext = createContext({
      selfPuuid: 'player-1',
      settings: {
        ...createDefaultOngoingGamePanelPlayerCardTagSettings(),
        showSelfTag: false
      }
    })

    expect(selfTag!.render(disabledContext)).toBeNull()
  })

  it('filters null tags and keeps display-only tags popover-free', () => {
    const tags = usePlayerCardTags(computed(() => createContext({ selfPuuid: 'player-1' })))

    expect(tags.value).toHaveLength(1)
    expect(tags.value[0].id).toBe('self')
    expect(tags.value[0].popover).toBeUndefined()
  })

  it('lets interactive popovers opt into hover keep-alive', () => {
    const taggedTag = PLAYER_CARD_TAGS.find((tag) => tag.id === 'tagged')
    expect(taggedTag).toBeDefined()

    const rendered = taggedTag!.render(
      createContext({
        savedInfo: createSavedInfo({
          tags: [
            {
              markedBySelf: false,
              puuid: 'player-1',
              selfPuuid: 'player-3',
              region: 'NA',
              rsoPlatformId: 'NA1',
              tag: 'careful',
              updateAt: new Date(0),
              lastMetAt: null
            }
          ]
        })
      })
    )

    expect(rendered?.popover?.keepAliveOnHover).toBe(true)
    expect(rendered?.popover?.scrollable).toBe(true)
  })

  it('keeps complex tag renderers independent from context data providers', () => {
    const context = createContext({
      analysis: createAnalysis(),
      settings: {
        ...createDefaultOngoingGamePanelPlayerCardTagSettings(),
        showAkariScoreTag: true
      }
    })
    const greatPerformanceTag = PLAYER_CARD_TAGS.find((tag) => tag.id === 'great-performance')
    const akariScoreTag = PLAYER_CARD_TAGS.find((tag) => tag.id === 'akari-score')

    expect(greatPerformanceTag).toBeDefined()
    expect(akariScoreTag).toBeDefined()
    expect(isVNode(greatPerformanceTag!.render(context)!.popover!.content)).toBe(true)
    expect(isVNode(akariScoreTag!.render(context)!.popover!.content)).toBe(true)
  })
})
