<template>
  <div
    class="control-item"
    :class="{
      'control-item-align-center': align === 'center',
      'control-item-align-start': align === 'start',
      'control-item-highlight': isHighlighting
    }"
  >
    <div
      class="control-item-label-area"
      :style="{ width: labelWidth ? `${labelWidth}px` : 'unset' }"
    >
      <div v-if="$slots.label" class="control-item-label">
        <slot name="label" :disabled="disabled"></slot>
      </div>
      <div v-else class="control-item-label" :class="{ 'control-item-disabled': disabled }">
        {{ label }}
      </div>
      <div
        v-if="$slots.labelDescription"
        class="control-item-label-desc"
        :class="{ 'control-item-disabled': disabled }"
      >
        <slot name="labelDescription" :disabled="disabled"></slot>
      </div>
      <div
        v-else-if="labelDescription"
        class="control-item-label-desc"
        :class="{ 'control-item-disabled': disabled }"
      >
        {{ labelDescription }}
      </div>
    </div>
    <div class="control-item-control"><slot></slot></div>
  </div>
</template>

<script setup lang="ts">
import { useTimeoutFn } from '@vueuse/core'
import { onMounted, ref } from 'vue'

const { align = 'center' } = defineProps<{
  itemId?: string
  labelWidth?: number
  align?: 'center' | 'start'
  label?: string
  labelDescription?: string
  disabled?: boolean
}>()

const isHighlighting = ref(false)
const highlight = () => {
  isHighlighting.value = true
  start()
}

const { start } = useTimeoutFn(() => {
  isHighlighting.value = false
}, 300)

onMounted(() => {})

defineExpose({
  highlight
})

defineOptions({
  __akari_isControlItem: true
})
</script>

<style>
@reference '@renderer-shared/assets/css/tailwind.css';

@layer components {
  .control-item {
    @apply flex w-full transition-colors duration-300;

    &:not(:last-child) {
      @apply mb-3;
    }
  }

  .control-item-align-center {
    @apply items-center;
  }

  .control-item-align-start {
    @apply items-start;
  }

  .control-item-label-area {
    @apply mr-6 shrink-0;
  }

  .control-item-label {
    @apply text-sm font-bold transition-colors duration-300;
    @apply text-black dark:text-gray-100;
  }

  .control-item-label-desc {
    @apply mt-0.5 text-[13px] transition-colors duration-300;
    @apply text-black/80 dark:text-white/80;
  }

  .control-item-disabled {
    @apply text-black/50 dark:text-white/50;
  }

  .control-item-control {
    @apply flex-1;
  }

  .control-item-highlight {
    @apply rounded bg-black/10 dark:bg-white/10;
  }
}
</style>
