<template>
  <div class="flex h-full overflow-hidden bg-transparent">
    <SummonerSearchSidebar
      ref="sidebarRef"
      @navigate-to-summoner="handleComponentNavigateToSummoner"
    />
    <SummonerSearchArea
      ref="searchAreaRef"
      @navigate-to-summoner="handleComponentNavigateToSummoner"
    />
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, useTemplateRef } from 'vue'

import SummonerSearchArea from './SummonerSearchArea.vue'
import SummonerSearchSidebar from './SummonerSearchSidebar.vue'

const sidebarRef = useTemplateRef('sidebarRef')
const searchAreaRef = useTemplateRef('searchAreaRef')

const emits = defineEmits<{
  navigateToSummoner: [puuid: string, sgpServerId: string | null, setCurrent?: boolean]
}>()

const handleComponentNavigateToSummoner = (
  puuid: string,
  sgpServerId: string | null,
  setCurrent?: boolean
) => {
  emits('navigateToSummoner', puuid, sgpServerId, setCurrent)
}

const cancel = () => {
  searchAreaRef.value?.cancel()
}

const reset = () => {
  sidebarRef.value?.reset()
  searchAreaRef.value?.reset()
}

reset()

defineExpose({
  reset,
  cancel
})

onUnmounted(() => {
  cancel()
})
</script>
