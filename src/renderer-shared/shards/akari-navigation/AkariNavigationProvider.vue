<template>
  <slot />
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'

import { AkariNavigationRenderer } from './index'
import { provideAkariNavigationRuntime } from './useAkariNavigation'

const navigation = useInstance(AkariNavigationRenderer)

provideAkariNavigationRuntime(navigation.runtime)
</script>
