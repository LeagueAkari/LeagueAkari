import { describe, expect, it, vi } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'

import RankedPane from './RankedPane.vue'

const { rankedStats } = vi.hoisted(() => ({
  rankedStats: {
    queueMap: {
      RANKED_SOLO_5x5: {
        queueType: 'RANKED_SOLO_5x5',
        tier: 'DIAMOND',
        division: 'II',
        leaguePoints: 64,
        wins: 138,
        losses: 119,
        previousSeasonHighestTier: 'DIAMOND',
        previousSeasonHighestDivision: 'IV',
        highestTier: 'MASTER',
        highestDivision: 'I'
      }
    },
    queues: []
  }
}))

vi.mock('../context', async () => {
  const { ref } = await import('vue')

  return {
    usePlayerTab: () => ({
      isCrossRegion: ref(false),
      isSmallSize: ref(false)
    })
  }
})

vi.mock('../data/ranked-stats', async () => {
  const { ref } = await import('vue')

  return {
    useRankedStats: () => ({
      rankedStats: ref(rankedStats),
      isLoading: ref(false)
    })
  }
})

vi.mock('i18next-vue', () => ({
  useTranslation: () => ({
    t: (key: string, options?: string | { defaultValue?: string }) => {
      if (typeof options === 'string') return options
      return options?.defaultValue ?? key
    }
  })
}))

describe('RankedPane', () => {
  it('shows the historical highest tier on ranked cards', async () => {
    const html = await renderToString(createSSRApp(RankedPane))

    expect(html).toContain('MASTER I')
    expect(html).not.toContain('DIAMOND IV')
  })
})
