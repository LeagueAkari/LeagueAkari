<template>
  <div class="relative flex flex-col px-2 pt-1 pb-2">
    <OpggTabAndFilters class="mb-1" />

    <KeepAlive>
      <OpggChampionTable class="min-h-0 flex-1" v-if="currentTab === 'champions'" />
      <OpggChampion class="min-h-0 flex-1" v-else-if="currentTab === 'champion'" />
    </KeepAlive>

    <SessionChampions />
  </div>
</template>

<script setup lang="ts">
import OpggChampion from './OpggChampion.vue'
import OpggChampionTable from './OpggChampionTable.vue'
import OpggTabAndFilters from './OpggTabAndFilters.vue'
import { useOpgg } from './context'
import SessionChampions from './widgets/SessionChampions.vue'

const { currentTab } = useOpgg()
</script>
