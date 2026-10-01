<template>
  <NPopover v-if="champions.length" raw placement="top-end" :show-arrow="false">
    <template #trigger>
      <div
        class="absolute right-5 bottom-5 flex cursor-pointer items-center gap-1 rounded-full bg-blue-400 py-1 pr-2 pl-1 text-white transition-opacity hover:opacity-20 dark:bg-neutral-600"
      >
        <ChampionIcon class="size-6" :champion-id="-1" ring :ring-color="triggerRingColor" round />
        <div class="text-sm">{{ $t('opgg.view.sessionChampions.title') }}</div>
      </div>
    </template>
    <div
      class="grid grid-cols-5 gap-2 rounded-lg bg-neutral-100 p-3 backdrop-blur-sm dark:bg-neutral-900"
    >
      <ChampionIcon
        class="size-9 cursor-pointer"
        v-for="c of champions"
        :key="c"
        :champion-id="c"
        ring
        :ring-color="itemRingColor"
        round
        @click="setTab('champion', c)"
      />
    </div>
  </NPopover>
</template>

<script lang="ts" setup>
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { NPopover } from 'naive-ui'
import { computed } from 'vue'

import { useOpgg } from '../context'

const lcs = useLeagueClientStore()
const as = useAppCommonStore()

const triggerRingColor = computed(() => {
  return as.colorTheme === 'dark' ? '#fff8' : 'rgba(0, 0, 0, 0.1)'
})

const itemRingColor = computed(() => {
  return as.colorTheme === 'dark' ? '#fff4' : 'rgba(0, 0, 0, 0.15)'
})

const { setTab } = useOpgg()

const champions = computed(() => {
  const s1 = lcs.gameflow.session

  if (!s1) {
    return []
  }

  if (s1.phase === 'ChampSelect') {
    const s2 = lcs.champSelect.session

    if (!s2) {
      return []
    }

    const c1 = s2.myTeam.map((t) => t.championId || t.championPickIntent).filter((c) => c > 0)
    const c2 = s2.theirTeam.map((t) => t.championId || t.championPickIntent).filter((c) => c > 0)

    return [...new Set([...c1, ...c2])]
  } else if (
    s1.phase === 'GameStart' ||
    s1.phase === 'InProgress' ||
    s1.phase === 'WaitingForStats' ||
    s1.phase === 'PreEndOfGame' ||
    s1.phase === 'EndOfGame' ||
    s1.phase === 'Reconnect'
  ) {
    const c1 = s1.gameData.teamOne.map((t) => t.championId).filter((c) => c > 0)
    const c2 = s1.gameData.teamTwo.map((t) => t.championId).filter((c) => c > 0)

    return [...new Set([...c1, ...c2])]
  }

  return []
})
</script>
