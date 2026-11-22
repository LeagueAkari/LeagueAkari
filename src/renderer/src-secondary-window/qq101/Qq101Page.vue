<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <Qq101ChampionTab v-if="pageState.view" />
  </div>
</template>

<script setup lang="ts">
import Qq101ChampionTab from './champion-tab/Qq101ChampionTab.vue'
import { provideQq101Page } from './context'

const props = defineProps<{ pageId: string }>()

const { pageState } = provideQq101Page(() => props.pageId)
</script>
