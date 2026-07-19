import type { AggregatedAnalysis } from '@shared/data-adapter/analysis/player'
import { createDefaultOngoingGamePanelPlayerCardTagSettings } from '@shared/shards/ongoing-game/settings'
import { describe, expect, it } from 'vitest'
import { isVNode } from 'vue'

import type { PlayerCardTagContext } from '../types'
import {
  AVERAGE_CS_PER_MINUTE_TAG,
  AVERAGE_DAMAGE_GOLD_EFFICIENCY_TAG,
  getEasyGankTag,
  getKillDamageEfficiencyTag
} from './basic'
import { SUSPICIOUS_FLASH_POSITION_TAG } from './suspicious-flash-position'

function collectText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(collectText).join('')
  }

  if (isVNode(value)) {
    return collectText(value.children)
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  return ''
}

const createAnalysis = (overrides: Partial<AggregatedAnalysis> = {}): AggregatedAnalysis =>
  ({
    count: 20,
    detailsCount: 10,
    summary: {
      avgKillDamageEfficiency: 1
    },
    spells: {
      flashOnD: 0,
      flashOnF: 0
    },
    details: {
      avgEarlyDeathsWithEnemyJunglerInvolved: null
    },
    ...overrides
  }) as AggregatedAnalysis

const createContext = (overrides: Partial<PlayerCardTagContext> = {}): PlayerCardTagContext =>
  ({
    puuid: 'player-1',
    selfPuuid: 'player-2',
    settings: createDefaultOngoingGamePanelPlayerCardTagSettings(),
    analysis: null,
    summoners: {},
    savedInfo: null,
    cachedGames: {},
    locale: 'zh-CN',
    t: ((key: string) => key) as PlayerCardTagContext['t'],
    masked: (text: string) => text,
    navigateToSummonerByPuuid: () => {},
    previewEncounteredGame: () => {},
    ...overrides
  }) as PlayerCardTagContext

describe('basic player card tags', () => {
  it('derives easy-gank tag thresholds from analyzed early jungle deaths', () => {
    expect(
      getEasyGankTag(
        createAnalysis({
          details: { avgEarlyDeathsWithEnemyJunglerInvolved: 2.1 } as AggregatedAnalysis['details']
        }),
        false
      )
    ).toMatchObject({
      kind: 'very-easy-gank',
      labelKey: 'ongoingGame.playerCard.veryEasyGank',
      count: 10
    })

    expect(
      getEasyGankTag(
        createAnalysis({
          details: { avgEarlyDeathsWithEnemyJunglerInvolved: 1.5 } as AggregatedAnalysis['details']
        }),
        false
      )
    ).toMatchObject({
      kind: 'easy-gank',
      labelKey: 'ongoingGame.playerCard.easyGank'
    })

    expect(
      getEasyGankTag(
        createAnalysis({
          details: { avgEarlyDeathsWithEnemyJunglerInvolved: 0.5 } as AggregatedAnalysis['details']
        }),
        false
      )
    ).toMatchObject({
      kind: 'hard-gank',
      labelKey: 'ongoingGame.playerCard.hardGank'
    })
  })

  it('does not create a tag for the neutral gankable range', () => {
    expect(
      getEasyGankTag(
        createAnalysis({
          details: { avgEarlyDeathsWithEnemyJunglerInvolved: 1 } as AggregatedAnalysis['details']
        }),
        false
      )
    ).toBeNull()

    expect(
      getEasyGankTag(
        createAnalysis({
          details: { avgEarlyDeathsWithEnemyJunglerInvolved: 1.49 } as AggregatedAnalysis['details']
        }),
        false
      )
    ).toBeNull()
  })

  it('does not create easy-gank tag for current junglers', () => {
    expect(
      getEasyGankTag(
        createAnalysis({
          details: { avgEarlyDeathsWithEnemyJunglerInvolved: 2.1 } as AggregatedAnalysis['details']
        }),
        true
      )
    ).toBeNull()
  })

  it('classifies kill damage efficiency outside the normal range', () => {
    expect(
      getKillDamageEfficiencyTag(
        createAnalysis({
          summary: { avgKillDamageEfficiency: 1.36 } as AggregatedAnalysis['summary']
        })
      )
    ).toEqual({ kind: 'high', value: 1.36 })

    expect(
      getKillDamageEfficiencyTag(
        createAnalysis({
          summary: { avgKillDamageEfficiency: 0.64 } as AggregatedAnalysis['summary']
        })
      )
    ).toEqual({ kind: 'low', value: 0.64 })

    expect(
      getKillDamageEfficiencyTag(
        createAnalysis({
          summary: { avgKillDamageEfficiency: 0.65 } as AggregatedAnalysis['summary']
        })
      )
    ).toEqual({ kind: 'normal', value: 0.65 })

    expect(
      getKillDamageEfficiencyTag(
        createAnalysis({
          summary: { avgKillDamageEfficiency: 1.35 } as AggregatedAnalysis['summary']
        })
      )
    ).toEqual({ kind: 'normal', value: 1.35 })
  })

  it('renders suspicious flash position details with chart popover data', () => {
    const rendered = SUSPICIOUS_FLASH_POSITION_TAG.render(
      createContext({
        analysis: createAnalysis({
          spells: {
            flashOnD: 3,
            flashOnF: 7
          }
        })
      })
    )

    expect(rendered).not.toBeNull()
    expect(isVNode(rendered!.popover!.content)).toBe(true)
    expect(rendered!.popover!.content.type).not.toBe('div')
    expect(rendered!.popover!.content.props).toMatchObject({
      flashOnD: 3,
      flashOnF: 7
    })
  })

  it('renders damage gold efficiency popover with value definition and usage', () => {
    const rendered = AVERAGE_DAMAGE_GOLD_EFFICIENCY_TAG.render(
      createContext({
        settings: {
          ...createDefaultOngoingGamePanelPlayerCardTagSettings(),
          showAverageDamageGoldEfficiencyTag: true
        },
        analysis: createAnalysis({
          count: 12,
          summary: {
            avgDamageGoldEfficiency: 1.23
          } as AggregatedAnalysis['summary']
        })
      })
    )

    expect(rendered).not.toBeNull()
    const text = collectText(rendered!.popover!.content)
    expect(text).toContain('ongoingGame.playerCard.damageGoldEfficiencyPopover')
    expect(text).toContain('ongoingGame.playerCard.damageGoldEfficiencyPopoverDefinition')
    expect(text).toContain('ongoingGame.playerCard.damageGoldEfficiencyPopoverUsage')
  })

  it('renders average CS per minute label and popover with team share', () => {
    const rendered = AVERAGE_CS_PER_MINUTE_TAG.render(
      createContext({
        settings: {
          ...createDefaultOngoingGamePanelPlayerCardTagSettings(),
          showAverageCsPerMinuteTag: true
        },
        analysis: createAnalysis({
          count: 16,
          summary: {
            avgCsPerMinute: 7.36,
            avgCsPercentageOfTeam: 0.278
          } as AggregatedAnalysis['summary']
        }),
        t: ((key: string, options?: Record<string, unknown>) =>
          `${key}:${Object.values(options ?? {}).join('|')}`) as PlayerCardTagContext['t']
      })
    )

    expect(rendered).not.toBeNull()
    const labelText = collectText(rendered!.label)
    const popoverText = collectText(rendered!.popover!.content)

    expect(labelText).toContain('ongoingGame.playerCard.csPerMinute')
    expect(labelText).toContain('7.4')
    expect(popoverText).toContain('ongoingGame.playerCard.csPerMinutePopover')
    expect(popoverText).toContain('ongoingGame.playerCard.csTeamSharePopover')
  })
})
