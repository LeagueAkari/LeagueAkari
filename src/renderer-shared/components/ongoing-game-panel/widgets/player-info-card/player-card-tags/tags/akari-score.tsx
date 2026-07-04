import { AkariScorePopoverContent } from '@renderer-shared/components/akari-score'

import type { PlayerCardTagDefinition } from '../types'

const TAG_CLASS = 'rounded-xs bg-[#b81b86] px-1 py-0.5 text-[11px] leading-[11px] text-white'

export const AKARI_SCORE_TAG: PlayerCardTagDefinition = {
  id: 'akari-score',
  render: (ctx) => {
    const analysis = ctx.analysis

    if (!ctx.settings.showAkariScoreTag || !analysis) {
      return null
    }

    return {
      label: <div class={TAG_CLASS}>Akari {analysis.akariScore.total.toFixed(2)}</div>,
      popover: {
        content: <AkariScorePopoverContent score={analysis.akariScore} totalPrecision={1} />
      }
    }
  }
}
