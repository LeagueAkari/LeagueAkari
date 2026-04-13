<template>
  <div
    v-if="collectState && page"
    class="border-akari-500/60 absolute top-8 right-8 z-15 flex items-center gap-2 rounded border bg-neutral-100 p-3 opacity-80 dark:bg-neutral-800"
  >
    <NSpin :size="16" />
    $正在收集中 ({{ page.games.length }} / {{ collectState.params.expectedCount }})
  </div>
</template>

<script setup lang="ts">
import { NSpin } from 'naive-ui'

import { useMatchHistory } from '../../data/match-history'

const { collectState, page } = useMatchHistory()
</script>
