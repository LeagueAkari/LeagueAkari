<template>
  <div class="flex flex-col gap-2">
    <MatchHistoryPagination />
    <NormalTagBlock />
    <SummaryPane />
    <ChampionMasteryPane />
    <RecentlyPlayers side="ally" />
    <RecentlyPlayers side="enemy" />
    <PlayerChallenges />
    <EncounteredGames />
  </div>
</template>

<script setup lang="ts">
import ChampionMasteryPane from './widgets/ChampionMasteryPane.vue'
import EncounteredGames from './widgets/EncounteredGames.vue'
import MatchHistoryPagination from './widgets/match-history-pagination'
import NormalTagBlock from './widgets/NormalTagBlock.vue'
import PlayerChallenges from './widgets/PlayerChallenges.vue'
import RecentlyPlayers from './widgets/RecentlyPlayers.vue'
import SummaryPane from './widgets/SummaryPane.vue'
</script>
