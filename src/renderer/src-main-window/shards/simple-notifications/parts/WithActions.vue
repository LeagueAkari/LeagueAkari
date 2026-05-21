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

<script setup lang="tsx">
import { ButtonProps, NButton } from 'naive-ui'
import { VNodeChild } from 'vue'

const { buttons = [] } = defineProps<{
  buttons?: (ButtonProps & {
    label: string | (() => VNodeChild)
  })[]
}>()

const renderText = (node: string | (() => VNodeChild)) => {
  if (typeof node === 'string') {
    return () => <>{node}</>
  }

  return node
}
</script>

<style scoped>
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
