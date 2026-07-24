<template>
  <slot />
</template>

<script setup lang="ts">
import { provideAkariResourceProvider } from './context'
import type { AkariResourceProviderValue } from './types'

const { value } = defineProps<{
  value: AkariResourceProviderValue
}>()

provideAkariResourceProvider(value)
</script>
