<template>
  <div class="flex min-h-0 flex-1 flex-col gap-2">
    <!-- header + tags -->
    <div class="flex items-end">
      <div
        v-if="teamIndicatorColorClass"
        :class="[
          'mr-2 size-[10px] self-center rounded-full border border-white/20',
          teamIndicatorColorClass
        ]"
      ></div>

      <span class="mr-3 text-base leading-tight font-bold">{{
        $t(`teams.${teamIdentifier}`, { ns: 'common', defaultValue: teamIdentifier })
      }}</span>

      <TeamTagsArea v-if="puuids.length >= 1" :teamIdentifier="teamIdentifier" />
    </div>

    <!-- players -->
    <div
      class="grid min-h-0 flex-1 gap-x-1 gap-y-2"
      :style="{ gridTemplateColumns: `repeat(${columnsNeed}, ${FIXED_CARD_WIDTH_PX_LITERAL})` }"
    >
      <PlayerInfoCard
        :style="playerCardStyles"
        v-for="player of puuids"
        :puuid="player"
        :key="player"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { FIXED_CARD_WIDTH_PX_LITERAL } from '../constants'
import { useOngoingGamePanel } from '../context'
import { getTeamIndicatorColorClass } from '../utils/theme'
import PlayerInfoCard from './PlayerInfoCard.vue'
import TeamTagsArea from './TeamTagsArea.vue'

const { teamIdentifier, puuids = [] } = defineProps<{
  teamIdentifier: string
  puuids?: string[]
}>()

const { columnsNeed, linesPerTeam, isTwoTeamsMode } = useOngoingGamePanel()

const playerCardStyles = computed(() => {
  if (isTwoTeamsMode.value && isTwoTeamsMode.value && linesPerTeam.value === 1) {
    return { height: '100%' }
  }

  return {
    height: '375px'
  }
})

const teamIndicatorColorClass = computed(() => {
  return getTeamIndicatorColorClass(teamIdentifier)
})
</script>
