import type { SavedInfo } from '@shared/shards/saved-player'
import type { PlayerTagDto } from '@shared/shards/saved-player'
import { riotId } from '@shared/utils/name'

import type { PlayerCardTagContext, PlayerCardTagDefinition } from '../types'

function getSortedPlayerTags(savedInfo: SavedInfo) {
  return [...savedInfo.tags].sort((a, b) => {
    if (a.markedBySelf && !b.markedBySelf) {
      return -1
    }

    return 0
  })
}

const renderTaggedPopover = (ctx: PlayerCardTagContext, sortedTags: PlayerTagDto[]) => {
  return (
    <div class="max-h-60 overflow-auto">
      <div class="flex flex-col gap-2">
        {sortedTags.map((tag) => (
          <div class="flex flex-col gap-1" key={tag.selfPuuid}>
            <div class="flex gap-1 text-xs">
              {tag.markedBySelf ? (
                ctx.t('ongoingGame.playerCard.taggedBySelf')
              ) : (
                <>
                  <span class="text-white/50">{ctx.t('ongoingGame.playerCard.taggedByOther')}</span>
                  {ctx.summoners[tag.selfPuuid] ? (
                    <span
                      class="cursor-pointer font-bold text-white"
                      onClick={() => ctx.navigateToSummonerByPuuid(tag.selfPuuid)}
                    >
                      {riotId(ctx.summoners[tag.selfPuuid])}
                    </span>
                  ) : (
                    <span class="font-bold text-white/50">
                      {ctx.t('ongoingGame.playerCard.unknown')}
                    </span>
                  )}
                </>
              )}
            </div>
            <div class="max-w-65 text-xs whitespace-pre-wrap">{tag.tag}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const TAGGED_TAG: PlayerCardTagDefinition = {
  id: 'tagged',
  render: (ctx) => {
    const savedInfo = ctx.savedInfo

    if (!ctx.settings.showTaggedTag || ctx.puuid === ctx.selfPuuid || !savedInfo) {
      return null
    }

    const sortedTags = getSortedPlayerTags(savedInfo)

    if (sortedTags.length === 0) {
      return null
    }

    return {
      label: (
        <div class="rounded-xs bg-[#49914d] px-1 py-0.5 text-[11px] leading-2.75 text-white">
          {ctx.t('ongoingGame.playerCard.tagged')}
        </div>
      ),
      popover: {
        content: renderTaggedPopover(ctx, sortedTags),
        keepAliveOnHover: true,
        scrollable: true
      }
    }
  }
}
