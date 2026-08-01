<template>
  <section
    ref="root"
    class="settings-section"
    :class="{
      'settings-section--no-bg': noBg,
      'settings-section--highlighted': highlighted
    }"
  >
    <header class="settings-section-header">
      <slot name="header">
        <span class="settings-section-title">{{ title }}</span>
      </slot>
    </header>
    <div class="settings-section-body">
      <slot />
    </div>
    <footer v-if="$slots.footer || footer" class="settings-section-footer">
      <slot name="footer">{{ footer }}</slot>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'

defineProps<{
  noBg?: boolean
  title?: string
  footer?: string
  highlighted?: boolean
}>()

const root = useTemplateRef<HTMLElement>('root')

defineExpose({
  getElement: () => root.value
})
</script>

<style>
@reference '@renderer-shared/assets/css/tailwind.css';

@layer components {
  .settings-section {
    --settings-row-x-padding: 12px;

    @apply box-border w-full max-w-full;
  }

  .settings-section-header {
    padding-left: var(--settings-row-x-padding);
    padding-right: var(--settings-row-x-padding);

    @apply mb-2;
  }

  .settings-section-title {
    @apply text-sm leading-5 font-bold text-black/80 dark:text-white/90;
  }

  .settings-section-body {
    position: relative;
    isolation: isolate;

    @apply w-full max-w-full overflow-hidden rounded-lg;
  }

  .settings-section--highlighted .settings-section-body {
    animation: settings-section-navigation-outline-fade 3400ms linear 1 forwards;
  }

  .settings-section--highlighted .settings-section-body::before {
    position: absolute;
    z-index: -1;
    inset: 0;
    content: '';
    pointer-events: none;
    background-color: color-mix(in srgb, var(--color-akari-400) 36%, transparent);
    animation: settings-section-navigation-highlight-fade 3400ms linear 1 forwards;
  }

  .settings-section:not(.settings-section--no-bg) .settings-section-body {
    @apply bg-black/5 dark:bg-white/8;
  }

  .settings-section-footer {
    padding-left: var(--settings-row-x-padding);
    padding-right: var(--settings-row-x-padding);

    @apply mt-1 text-xs leading-snug text-black/55 dark:text-white/55;
  }
}

@keyframes settings-section-navigation-highlight-fade {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

@keyframes settings-section-navigation-outline-fade {
  from {
    box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--color-akari-400) 90%, transparent);
  }

  to {
    box-shadow: inset 0 0 0 2px transparent;
  }
}
</style>
