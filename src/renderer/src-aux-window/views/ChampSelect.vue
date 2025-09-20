<template>
  <NScrollbar class="champ-select-wrapper">
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

<style>
.champ-select-wrapper {
  padding: 8px 12px;
  box-sizing: border-box;
}
</style>
