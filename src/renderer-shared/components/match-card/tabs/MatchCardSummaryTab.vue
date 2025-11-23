<template>
  <div>
    <div
      class="flex justify-end mb-2 dark:bg-neutral-800 bg-neutral-200 px-2 py-1 rounded-xs"
      v-if="basicInfo.isCherrySubteam"
    >
      <div class="flex gap-0.5">
        <div class="text-xs dark:text-white/60 text-black/60 mr-1">禁用</div>
        <ChampionIcon
          v-for="ban in teams.allTeamStats.bans.slice(0, 32)"
          :key="ban.championId"
          :champion-id="ban.championId"
          class="size-4 rounded-xs"
        />
      </div>
    </div>
    <TeamTable
      v-for="team of sortedTeams"
      :key="team.teamIdentifier"
      :team-identifier="team.teamIdentifier"
      class="not-last:mb-2"
    />
  </div>
</template>

<script lang="ts" setup>
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { computed } from 'vue'

import { useMatchCard } from '../context'
import TeamTable from '../widgets/TeamTable.vue'

const { teams, basicInfo } = useMatchCard()

const sortedTeams = computed(() => {
  if (basicInfo.value.isCherrySubteam) {
    return teams.value.teamStatsArr.toSorted((a, b) => {
      return a.subteamPlacement - b.subteamPlacement
    })
  }

  return teams.value.teamStatsArr.toSorted((a, b) => {
    return a.teamIdentifier.localeCompare(b.teamIdentifier)
  })
})
</script>
