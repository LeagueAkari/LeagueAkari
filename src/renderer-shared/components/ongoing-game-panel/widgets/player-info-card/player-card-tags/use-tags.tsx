import { type ComputedRef, computed } from 'vue'

import { PLAYER_CARD_TAGS } from './tags'
import type { PlayerCardTagContext, PlayerCardTagView } from './types'

export type { PlayerCardTagContext, PlayerCardTagDefinition, PlayerCardTagView } from './types'

export function usePlayerCardTags(ctx: ComputedRef<PlayerCardTagContext>) {
  return computed<PlayerCardTagView[]>(() => {
    return PLAYER_CARD_TAGS.flatMap((tag) => {
      const rendered = tag.render(ctx.value)

      return rendered ? [{ id: tag.id, ...rendered }] : []
    })
  })
}
