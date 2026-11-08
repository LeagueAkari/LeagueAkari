<template>
  <OpggChampionDetails class="h-full" />
</template>

<script setup lang="ts">
import OpggChampionDetails from './OpggChampionDetails.vue'
import { provideOpggChampion } from '../context'

const props = defineProps<{ pageId: number }>()

provideOpggChampion(() => props.pageId)
</script>
