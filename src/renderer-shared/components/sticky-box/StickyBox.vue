<!-- StickyBox.vue -->
<template>
  <div ref="rootEl">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'

import { type StickyBoxConfig, useStickyBox } from './useStickyBox'

const props = defineProps<StickyBoxConfig>()
const rootEl = useTemplateRef('rootEl')

useStickyBox(rootEl, props)
</script>
