<template>
  <div
    class="settings-row"
    :class="{
      'settings-row--center': align === 'center',
      'settings-row--start': align === 'start',
      'settings-row--disabled': disabled,
      'settings-row--control-full-line': controlFullLine
    }"
    :style="{
      '--settings-row-label-width': labelWidth ? `${labelWidth}px` : '220px',
      '--settings-row-gap': gap ? `${gap}px` : '48px',
      '--settings-row-label-min-width': labelMinWidth ? `${labelMinWidth}px` : '0px'
    }"
  >
    <div class="settings-row-label">
      <div v-if="$slots.label" class="settings-row-label-main">
        <slot name="label" :disabled="disabled"></slot>
      </div>
      <div v-else class="settings-row-label-main">
        {{ label }}
      </div>
      <div v-if="$slots.labelDescription" class="settings-row-label-description">
        <slot name="labelDescription" :disabled="disabled"></slot>
      </div>
      <div v-else-if="labelDescription" class="settings-row-label-description">
        {{ labelDescription }}
      </div>
    </div>
    <div class="settings-row-control">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
const { align = 'center' } = defineProps<{
  label?: string
  labelDescription?: string
  labelWidth?: number
  labelMinWidth?: number
  gap?: number
  controlFullLine?: boolean
  align?: 'center' | 'start'
  disabled?: boolean
}>()
</script>

<style>
@reference '@renderer-shared/assets/css/tailwind.css';

@layer components {
  .settings-row {
    padding-left: var(--settings-row-x-padding);
    padding-right: var(--settings-row-x-padding);
    column-gap: var(--settings-row-gap);

    @apply box-border flex min-h-13 w-full max-w-full border-b border-black/5 py-3 dark:border-white/10;
  }

  .settings-row:last-child {
    @apply border-b-0;
  }

  .settings-row--center {
    @apply items-center;
  }

  .settings-row--start {
    @apply items-start;
  }

  .settings-row--control-full-line {
    row-gap: 8px;

    @apply flex-wrap;
  }

  .settings-row-label {
    flex: 1 1 var(--settings-row-label-width);
    min-width: min(var(--settings-row-label-min-width), 100%);
  }

  .settings-row--control-full-line .settings-row-label {
    @apply basis-full;
  }

  .settings-row-label-main {
    @apply text-sm font-normal text-black/80 dark:text-white/90;
  }

  .settings-row-label-description {
    @apply mt-0.5 text-[13px] text-black/60 dark:text-white/60;
  }

  .settings-row--disabled .settings-row-label-main,
  .settings-row--disabled .settings-row-label-description {
    @apply text-black/50 dark:text-white/50;
  }

  .settings-row-control {
    flex: 0 1 auto;
    max-width: calc(100% - var(--settings-row-gap));

    @apply flex min-w-0 justify-end;
  }

  .settings-row--control-full-line .settings-row-control {
    @apply justify-start;
  }

  .settings-row--control-full-line .settings-row-control {
    @apply max-w-full basis-full;
  }

  .settings-row-control > * {
    @apply max-w-full;
  }
}
</style>
