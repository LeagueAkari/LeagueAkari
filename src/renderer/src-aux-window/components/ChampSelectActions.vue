<template>
  <NCard size="small" v-if="myActions && myActions.length">
    <NScrollbar class="max-h-[240px]!" ref="scrollbar">
      <NTimeline>
        <NTimelineItem v-for="a of myActions" :type="getTimelineTypeByAction(a)">
          <template #header>
            <span
              class="text-[11px]"
              :class="{
                'brightness-80': a.completed,
                'text-black dark:text-white': a.isInProgress,
                'text-black/60 dark:text-white/60': !a.isInProgress
              }"
              >{{ formatActionTypeText(a) }}</span
            >
          </template>

          <template v-if="a.completed">
            <div class="flex items-center gap-1 brightness-80" v-if="a.type === 'pick'">
              <ChampionIcon class="size-4 rounded" :stretched="false" :champion-id="a.championId" />
              <span class="text-[10px] text-black/60 dark:text-white/60">{{
                t('ChampSelectActions.picked')
              }}</span>
            </div>
            <div class="flex items-center gap-1 brightness-80" v-else-if="a.type === 'vote'">
              <ChampionIcon class="size-4 rounded" :stretched="false" :champion-id="a.championId" />
              <span class="text-[10px] text-black/60 dark:text-white/60">{{
                t('ChampSelectActions.voted')
              }}</span>
            </div>
            <div class="flex items-center gap-1 brightness-80" v-else-if="a.type === 'ban'">
              <ChampionIcon class="size-4 rounded" :stretched="false" :champion-id="a.championId" />
              <span class="text-[10px] text-black/60 dark:text-white/60">{{
                t('ChampSelectActions.banned')
              }}</span>
            </div>
          </template>
        </NTimelineItem>
      </NTimeline>
    </NScrollbar>
  </NCard>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useScrollFollow } from '@renderer-shared/composables/useScrollFollow'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { Action } from '@shared/types/league-client/champ-select'
import { useTranslation } from 'i18next-vue'
import { NCard, NScrollbar, NTimeline, NTimelineItem } from 'naive-ui'
import { computed, useTemplateRef } from 'vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()

const scrollbarEl = useTemplateRef('scrollbar')

useScrollFollow(() => scrollbarEl.value?.scrollbarInstRef?.containerRef, { threshold: 4 })

const formatActionTypeText = (action: Action) => {
  let actionName: string
  switch (action.type) {
    case 'pick':
      actionName = t('ChampSelectActions.picking')
      break
    case 'ban':
      actionName = t('ChampSelectActions.banning')
      break
    case 'vote':
      actionName = t('ChampSelectActions.voting')
      break
    case 'ten_bans_reveal':
    case 'phase_transition':
    case 'vote_transition':
    case 'team_vote_reveal':
      actionName = t(`ChampSelectActions.ceremonies.${action.type}`)
      break

    default:
      return action.type
  }

  let finishStatus: string = ''
  if (action.isInProgress) {
    finishStatus = t('ChampSelectActions.inProgress')
  } else if (action.completed) {
    finishStatus = t('ChampSelectActions.completed')
  }

  return finishStatus ? `${actionName} (${finishStatus})` : actionName
}

const getTimelineTypeByAction = (action: Action) => {
  if (action.completed) {
    return 'success'
  }

  if (action.isInProgress) {
    return 'info'
  }

  return 'default'
}

// 基于假设，每个 action group 中只有一个属于自己
const myActions = computed(() => {
  if (!lcs.champSelect.session) {
    return null
  }

  return lcs.champSelect.session.actions
    .map((arr) => arr.filter((a) => a.actorCellId === lcs.champSelect.session!.localPlayerCellId))
    .filter((arr) => arr.length)
    .map((arr) => arr[0])
})
</script>
