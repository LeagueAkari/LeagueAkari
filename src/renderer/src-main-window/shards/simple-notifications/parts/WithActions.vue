<template>
  <div class="with-actions">
    <slot />
    <div class="actions" v-if="buttons">
      <NButton v-for="button in buttons" v-bind="button" :size="button.size ?? 'tiny'">
        <component :is="renderText(button.label)" />
      </NButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ButtonProps, NButton } from 'naive-ui'
import { VNodeChild, h } from 'vue'

const { buttons = [] } = defineProps<{
  buttons?: (ButtonProps & {
    label: string | (() => VNodeChild)
  })[]
}>()

const renderText = (node: string | (() => VNodeChild)) => {
  if (typeof node === 'string') {
    return h('span', node)
  }

  return { render: node }
}
</script>

<style scoped lang="less">
.with-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  flex-wrap: wrap;
}
</style>
