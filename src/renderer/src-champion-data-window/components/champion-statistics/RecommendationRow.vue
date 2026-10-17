<template>
  <div
    class="flex min-w-0 flex-col justify-center gap-2 text-xs last:mb-0"
    :class="{
      'mb-1 min-h-8': layout === 'compact',
      'mb-3 min-h-8': layout === 'runes',
      'mb-8 min-h-14': layout === 'skills'
    }"
  >
    <div class="flex min-w-0 items-center" :class="layout === 'skills' ? 'gap-0.5' : 'gap-1'">
      <!-- 技能方案的序号宽度与加点表的行标签列一致。 -->
      <RecommendationRank :rank="rank" :class="{ 'w-8': layout === 'skills' }" />

      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-2">
        <div
          class="flex min-w-0 flex-wrap items-center gap-1"
          :class="layout === 'skills' ? 'shrink-0' : 'flex-1'"
        >
          <slot />
        </div>

        <div
          v-if="$slots.metrics || $slots.actions"
          class="ml-auto flex flex-wrap items-center justify-end gap-y-2"
          :class="{ 'gap-x-3': layout === 'skills' }"
        >
          <slot name="metrics" />

          <div v-if="$slots.actions" class="flex min-w-19 justify-center">
            <slot name="actions" />
          </div>
        </div>
      </div>
    </div>

    <div v-if="$slots.details" class="min-w-0">
      <slot name="details" />
    </div>
  </div>
</template>

<script setup lang="ts">
import RecommendationRank from './RecommendationRank.vue'

const { layout = 'compact' } = defineProps<{
  rank: number | null
  layout?: 'compact' | 'runes' | 'skills'
}>()
</script>
