<template>
  <section
    ref="root"
    class="settings-section"
    :data-setting-id="settingId"
    :class="{
      'settings-section--no-bg': noBg,
      'settings-section--navigation-highlighted': isNavigationHighlighted
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
import { useSettingsNavigationTarget } from '@renderer-shared/composables/useSettingsNavigationTarget'
import { useTemplateRef } from 'vue'

const { settingId } = defineProps<{
  settingId?: string
  noBg?: boolean
  title?: string
  footer?: string
}>()

const root = useTemplateRef<HTMLElement>('root')
const isNavigationHighlighted = useSettingsNavigationTarget(() => settingId, root)
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

  .settings-section--navigation-highlighted .settings-section-body {
    animation: settings-section-navigation-outline-fade 2200ms linear 1 forwards;
  }

  .settings-section--navigation-highlighted .settings-section-body::before {
    position: absolute;
    z-index: -1;
    inset: 0;
    content: '';
    pointer-events: none;
    background-color: color-mix(in srgb, var(--color-akari-500) 18%, transparent);
    background-image: linear-gradient(
      100deg,
      transparent 32%,
      color-mix(in srgb, var(--color-akari-400) 24%, transparent) 42%,
      color-mix(in srgb, var(--color-akari-300) 60%, transparent) 50%,
      color-mix(in srgb, var(--color-akari-400) 24%, transparent) 58%,
      transparent 68%
    );
    background-position: 100% 0;
    background-repeat: no-repeat;
    background-size: 240% 100%;
    animation:
      settings-section-navigation-highlight-fade 2200ms linear 1 forwards,
      settings-section-navigation-shimmer 1600ms linear 180ms 1 both;
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
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-akari-500) 72%, transparent);
  }

  to {
    box-shadow: 0 0 0 2px transparent;
  }
}

@keyframes settings-section-navigation-shimmer {
  from {
    background-position: 100% 0;
  }

  to {
    background-position: 0 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .settings-section--navigation-highlighted .settings-section-body::before {
    background-image: none;
    animation: settings-section-navigation-highlight-fade 2200ms linear 1 forwards;
  }
}
</style>
