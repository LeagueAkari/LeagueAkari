<template>
  <div>
    <TeamTable
      v-for="team of teams.teamStatsArr"
      :key="team.teamIdentifier"
      :team-identifier="team.teamIdentifier"
      class="not-last:mb-2"
    />
  </div>
</template>

<script lang="ts" setup>
import { useMatchCard } from '../context'
import TeamTable from '../widgets/TeamTable.vue'

const { teams } = useMatchCard()
</script>
