import { PlayerTagEditPanel } from '@renderer-shared/components/player-tag-edit'
import type { SavedInfo } from '@shared/shards/saved-player'
import type { PlayerTagDto } from '@shared/shards/saved-player'
import { riotId } from '@shared/utils/name'
import { NPopover } from 'naive-ui'
import { type PropType, computed, defineComponent, ref } from 'vue'

import { useOngoingGamePanel } from '../../../../context'
import type { PlayerCardTagContext, PlayerCardTagDefinition } from '../types'

function getSortedPlayerTags(savedInfo: SavedInfo) {
  return [...savedInfo.tags].sort((a, b) => {
    if (a.markedBySelf && !b.markedBySelf) {
      return -1
    }

    if (!a.markedBySelf && b.markedBySelf) {
      return 1
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

const TAGGED_LABEL_CLASS =
  'm-0 inline-flex cursor-pointer appearance-none items-center rounded-xs border-0 bg-[#49914d] px-1 py-0.5 font-[inherit] text-[11px] leading-2.75 text-white transition hover:bg-[#5aa15e] focus-visible:outline-1 focus-visible:outline-white/70'

const STATIC_TAGGED_LABEL_CLASS =
  'inline-flex items-center rounded-xs bg-[#49914d] px-1 py-0.5 text-[11px] leading-2.75 text-white'

const PlayerCardTaggedTag = defineComponent({
  name: 'PlayerCardTaggedTag',
  props: {
    ctx: {
      type: Object as PropType<PlayerCardTagContext>,
      required: true
    },
    sortedTags: {
      type: Array as PropType<PlayerTagDto[]>,
      required: true
    }
  },
  setup(props) {
    const { ongoingGame } = useOngoingGamePanel()
    const isDetailShowing = ref(false)
    const isEditing = ref(false)

    const canEdit = computed(
      () =>
        !props.ctx.isStandaloneOngoingGameWindow &&
        !!props.ctx.selfPuuid &&
        props.ctx.puuid !== props.ctx.selfPuuid
    )
    const summoner = computed(() => ongoingGame.value.summoner[props.ctx.puuid] ?? null)

    const handleDetailShowUpdate = (show: boolean) => {
      isDetailShowing.value = show
    }

    const handleEditShowUpdate = (show: boolean) => {
      isEditing.value = show

      if (show) {
        isDetailShowing.value = false
      }
    }

    const handleTagSaved = () => {
      isEditing.value = false
      ongoingGame.value.reloadPlayer(props.ctx.puuid, { includes: ['savedInfo'] })
    }

    const renderLabel = () => {
      if (!canEdit.value) {
        return (
          <div class={STATIC_TAGGED_LABEL_CLASS}>
            {props.ctx.t('ongoingGame.playerCard.tagged')}
          </div>
        )
      }

      return (
        <NPopover
          {...{
            show: isEditing.value,
            'onUpdate:show': handleEditShowUpdate
          }}
          trigger="click"
          placement="bottom-start"
          v-slots={{
            trigger: () => (
              <button
                type="button"
                class={TAGGED_LABEL_CLASS}
                aria-label={props.ctx.t('ongoingGame.playerCard.editTag')}
                onClick={(event) => event.stopPropagation()}
              >
                {props.ctx.t('ongoingGame.playerCard.tagged')}
              </button>
            ),
            default: () =>
              isEditing.value ? (
                <PlayerTagEditPanel
                  puuid={props.ctx.puuid}
                  summoner={summoner.value}
                  onCancel={() => (isEditing.value = false)}
                  onSaved={handleTagSaved}
                />
              ) : null
          }}
        />
      )
    }

    return () => (
      <NPopover
        {...{
          show: isEditing.value ? false : isDetailShowing.value,
          'onUpdate:show': handleDetailShowUpdate
        }}
        trigger="hover"
        delay={50}
        keepAliveOnHover
        scrollable
        v-slots={{
          trigger: renderLabel,
          default: () => renderTaggedPopover(props.ctx, props.sortedTags)
        }}
      />
    )
  }
})

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

    if (ctx.isStandaloneOngoingGameWindow) {
      return {
        label: (
          <div class={STATIC_TAGGED_LABEL_CLASS}>{ctx.t('ongoingGame.playerCard.tagged')}</div>
        ),
        popover: {
          content: renderTaggedPopover(ctx, sortedTags),
          keepAliveOnHover: true,
          scrollable: true
        }
      }
    }

    return {
      label: <PlayerCardTaggedTag ctx={ctx} sortedTags={sortedTags} />
    }
  }
}
