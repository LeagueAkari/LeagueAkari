import type { InGameSendPresetId } from '@shared/types/shards/in-game-send'

import { buildJunglePresetLines } from './jungle'
import { buildPremadePresetLines } from './premade'
import { buildRatingPresetLines } from './rating'
import type { InGameSendPresetContext } from './types'

export function buildInGameSendPresetLines(
  presetId: InGameSendPresetId,
  context: InGameSendPresetContext
) {
  switch (presetId) {
    case 'rating':
      return buildRatingPresetLines(context)
    case 'jungle':
      return buildJunglePresetLines(context)
    case 'premade':
      return buildPremadePresetLines(context)
  }
}

export type { InGameSendPresetContext }
