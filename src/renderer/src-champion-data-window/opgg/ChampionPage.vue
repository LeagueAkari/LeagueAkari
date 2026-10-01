<template>
  <Champion class="h-full" />
</template>

<script setup lang="ts">
import Champion from './Champion.vue'
import { provideOpggChampion } from './context'

const props = defineProps<{ championId: number }>()
provideOpggChampion(() => props.championId)
</script>
