<template>
  <slot />
</template>

<script setup lang="ts">
import { provideOngoingGameProvider } from './context'
import type { OngoingGameProviderValue } from './types'

const { value } = defineProps<{
  value: OngoingGameProviderValue
}>()

provideOngoingGameProvider(value)
</script>
