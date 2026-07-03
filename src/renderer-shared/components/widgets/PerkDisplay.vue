<template>
  <NPopover v-if="perkDisplay" :delay="50">
    <template #trigger>
      <LcuImage
        :src="perkDisplay.iconPath"
        v-bind="$attrs"
        :style="{ width: `${size}px`, height: `${size}px` }"
        class="perk"
      />
    </template>
    <div :style="{ 'max-width': `${maxWidth}px` }" class="info">
      <LcuImage class="image" :src="perkDisplay.iconPath" />
      <div class="right-side">{{ perkDisplay.name }}</div>
    </div>
    <div
      :style="{ 'max-width': `${maxWidth}px` }"
      style="font-size: 12px"
      lol-view
      v-html="perkDisplay.longDescriptionHtml"
    ></div>
  </NPopover>
  <div
    v-else
    :style="{ width: `${size}px`, height: `${size}px` }"
    v-bind="$attrs"
    class="empty"
  ></div>
</template>

<script setup lang="ts">
import { useGameResourceProvider } from '@renderer-shared/providers/game-resource'
import { NPopover } from 'naive-ui'
import { computed } from 'vue'

import LcuImage from '../LcuImage.vue'

const {
  perkId,
  size = 20,
  maxWidth = 400
} = defineProps<{
  perkId?: number
  size?: number
  maxWidth?: number
}>()

const resources = useGameResourceProvider()
const perkDisplay = computed(() => {
  if (!perkId) {
    return null
  }

  return resources.perks.display(perkId)
})
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

@layer components {
  .perk,
  .empty {
    border-radius: 2px;
  }

  .info {
    display: flex;
    align-items: center;
    margin-bottom: 8px;

    .image {
      border-radius: 2px;
      height: 28px;
    }

    .right-side {
      margin-left: 8px;
      font-size: 12px;
      font-weight: bold;
    }
  }

  .empty {
    @apply bg-gray-500/40 dark:bg-black/20;
  }
}
</style>
