<template>
  <OpggChampionDetails class="h-full" />
</template>

<script setup lang="ts">
import OpggChampionDetails from './OpggChampionDetails.vue'
import { provideOpggPage } from '../context'

const props = defineProps<{ pageId: number }>()

provideOpggPage(() => props.pageId)
</script>
