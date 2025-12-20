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
import AutomationPlan from '@aux-window/components/AutomationPlan.vue'
import BenchChampionsMini from '@aux-window/components/BenchChampionsMini.vue'
import ChampSelectActions from '@aux-window/components/ChampSelectActions.vue'
import ChampSelectOperations from '@aux-window/components/ChampSelectOperations.vue'
import SkinSelectionMini from '@aux-window/components/SkinSelectionMini.vue'
import { NScrollbar } from 'naive-ui'
</script>
