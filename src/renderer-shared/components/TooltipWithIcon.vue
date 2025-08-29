<template>
  <div class="i-tooltip">
    <slot v-if="$slots.default"></slot>
    <div v-else>Default Content</div>
    <NPopover v-if="$slots.tooltip || tooltip">
      <template #trigger>
        <NIcon class="i-tooltip__icon"><InformationFilledIcon /></NIcon>
      </template>
      <slot name="tooltip" v-if="$slots.tooltip"></slot>
      <span v-else>{{ tooltip }}</span>
    </NPopover>
    <NIcon class="i-tooltip__icon" v-else><InformationFilledIcon /></NIcon>
  </div>
</template>

<script setup lang="ts">
import { InformationFilled as InformationFilledIcon } from '@vicons/carbon'
import { NIcon, NPopover } from 'naive-ui'

const { tooltip } = defineProps<{
  tooltip?: string
}>()
</script>

<style scoped>
.i-tooltip {
  display: flex;
  align-items: center;
  gap: 4px;

  .i-tooltip__icon {
    font-size: 1em;
    color: inherit;
  }
}
</style>
