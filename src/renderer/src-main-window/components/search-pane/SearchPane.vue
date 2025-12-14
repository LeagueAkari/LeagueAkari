<template>
  <div
    class="flex h-full b-1 b-solid b-white/10 rounded-lg overflow-hidden dark:bg-neutral-900 bg-neutral-100"
  >
    <SearchPaneSidebar ref="sidebarRef" @navigate-to-summoner="handleComponentNavigateToSummoner" />
    <SearchPaneSearchArea
      ref="searchAreaRef"
      @navigate-to-summoner="handleComponentNavigateToSummoner"
    />
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, useTemplateRef } from 'vue'

import SearchPaneSearchArea from './SearchPaneSearchArea.vue'
import SearchPaneSidebar from './SearchPaneSidebar.vue'

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
