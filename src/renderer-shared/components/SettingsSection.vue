<template>
  <section
    class="settings-section"
    :class="{
      'settings-section--no-bg': noBg
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
defineProps<{
  noBg?: boolean
  title?: string
  footer?: string
}>()
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
    @apply w-full max-w-full overflow-hidden rounded-lg;
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
</style>
