<template>
  <div class="flex h-6 items-center gap-1 p-0.5">
    <div
      class="flex aspect-square cursor-pointer items-center justify-center rounded-[2px] border border-black/10 text-base text-black/60 transition-colors hover:border-black/30 hover:bg-black/10 hover:text-black dark:border-white/10 dark:text-white/60 dark:hover:border-white/30 dark:hover:bg-white/10 dark:hover:text-white"
      :class="
        positionModel === position
          ? 'border-black/50 bg-black/15 text-black dark:border-white/60 dark:bg-white/15 dark:text-white'
          : ''
      "
      v-for="position in POSITIONS"
      :key="position"
      @click="handleClick(position)"
    >
      <PositionIcon :position="position" />
    </div>
  </div>
</template>

<script setup lang="ts">
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'

const positionModel = defineModel<string | null>('position', { default: null })

const POSITIONS = ['TOP', 'MIDDLE', 'JUNGLE', 'BOTTOM', 'UTILITY']

const handleClick = (position: string) => {
  if (positionModel.value === position) {
    positionModel.value = null
  } else {
    positionModel.value = position
  }
}
</script>

<style scoped></style>
