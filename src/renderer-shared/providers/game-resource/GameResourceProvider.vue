<template>
  <slot />
</template>

<script setup lang="ts">
import { provideGameResourceProvider } from './context'
import type { GameResourceProviderValue } from './types'

const { value } = defineProps<{
  value: GameResourceProviderValue
}>()

provideGameResourceProvider(value)
</script>
