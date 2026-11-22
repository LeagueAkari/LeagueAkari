<template>
  <NScrollbar class="box-border px-3 py-2">
    <div class="flex flex-col gap-6">
      <ChampionBenchPanel />
      <ChampSelectActions />
      <AutomationPlan />
      <SkinSelectionMini />
      <ChampSelectOperations />
    </div>
  </NScrollbar>
</template>

<script setup lang="ts">
import {
  AutomationPlan,
  ChampSelectActions,
  ChampSelectOperations,
  SkinSelectionMini
} from '@renderer-shared/components/champ-select-assistant'
import { NScrollbar } from 'naive-ui'

import ChampionBenchPanel from './champion-bench/ChampionBenchPanel.vue'
</script>
