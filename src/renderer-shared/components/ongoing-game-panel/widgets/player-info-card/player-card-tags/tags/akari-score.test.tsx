import { createDefaultOngoingGamePanelPlayerCardTagSettings } from '@shared/shards/ongoing-game/settings'
import { describe, expect, it } from 'vitest'
import { isVNode } from 'vue'

import type { PlayerCardTagContext } from '../types'
import { AKARI_SCORE_TAG } from './akari-score'

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

const createContext = (overrides: Partial<PlayerCardTagContext> = {}): PlayerCardTagContext =>
  ({
    puuid: 'player-1',
    selfPuuid: 'player-2',
    settings: {
      ...createDefaultOngoingGamePanelPlayerCardTagSettings(),
      showAkariScoreTag: true
    },
    analysis: {
      akariScore: {
        total: 4.23,
        outstanding: false,
        extraordinary: false
      }
    },
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

describe('akari score tag', () => {
  it('renders a short reference-only summary before the score breakdown', () => {
    const rendered = AKARI_SCORE_TAG.render(createContext())

    expect(rendered).not.toBeNull()
    const text = collectText(rendered!.popover!.content)

    expect(text).toContain('ongoingGame.playerCard.akariScorePopoverDescription')
  })
})
