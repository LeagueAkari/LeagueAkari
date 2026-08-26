<template>
  <NScrollbar class="box-border px-3 py-2">
    <BenchChampionsMini style="margin-bottom: 4px" />
    <ChampSelectActions style="margin-bottom: 4px" />
    <AutomationPlan style="margin-bottom: 4px" />
    <SkinSelectionMini style="margin-bottom: 4px" />
    <ChampSelectOperations />
  </NScrollbar>
</template>

<script setup lang="ts">
import {
  AutomationPlan,
  BenchChampionsMini,
  ChampSelectActions,
  ChampSelectOperations,
  SkinSelectionMini
} from '@renderer-shared/components/champ-select-assistant'
import { NScrollbar } from 'naive-ui'
</script>
