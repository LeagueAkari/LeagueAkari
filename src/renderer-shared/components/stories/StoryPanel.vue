<template>
  <section
    class="box-border w-full min-w-0 rounded-lg border border-black/10 bg-white/55 p-4 shadow-sm shadow-black/5 dark:border-white/10 dark:bg-white/4 dark:shadow-black/20"
  >
    <div v-if="title || description" class="mb-3">
      <h2 v-if="title" class="text-sm font-semibold text-black/85 dark:text-white/90">
        {{ title }}
      </h2>
      <p v-if="description" class="mt-1 text-xs leading-relaxed text-black/55 dark:text-white/55">
        {{ description }}
      </p>
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()
</script>
