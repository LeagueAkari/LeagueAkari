<template>
  <div class="size-full min-h-0">
    <NScrollbar>
      <Game :nodeId="rootNode.id" />
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import { NScrollbar } from 'naive-ui'

import Game from './combinator-components/Game.vue'
import { provideMatchHistoryFilterEditor } from './context'
import { MatchHistoryFilterState, createEmptyState } from './filter-state'

const filterState = defineModel<MatchHistoryFilterState>({
  default: () => createEmptyState()
})

const { rootNode } = provideMatchHistoryFilterEditor(filterState)
</script>
