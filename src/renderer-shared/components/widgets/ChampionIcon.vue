<template>
  <div class="champion-icon-container" :class="{ round: round }">
    <img class="plain-img" v-if="imageSource?.source === 'url'" :src="imageSource.iconPath" />
    <LcuImage
      v-else
      class="champion-icon"
      :class="{ 'champion-icon-stretched': stretched }"
      :src="imageSource?.iconPath"
    />
    <div
      v-if="ring"
      class="champion-icon-ring"
      :class="{ round: round }"
      :style="{
        borderColor: ringColor || '#2a947d',
        borderWidth: `${ringWidth}px` || '2px'
      }"
    ></div>
  </div>
</template>

<script lang="ts" setup>
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { computed } from 'vue'

import LcuImage from '../LcuImage.vue'

const { championId = -1, stretched = true } = defineProps<{
  championId?: number
  round?: boolean
  stretched?: boolean // to remove the black border

  // ring 系列属性可以 deprecated 了，未来将逐渐取代
  ring?: boolean
  ringColor?: string
  ringWidth?: number
}>()

const resources = useAkariResourceProvider()

const imageSource = computed(() => resources.champions.icon(championId))
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

@layer components {
  .champion-icon-container {
    position: relative;
    overflow: hidden;

    .plain-img {
      display: block;
      width: 100%;
      height: 100%;
    }

    /*  default size */
    width: 64px;
    height: 64px;

    &.round {
      border-radius: 50%;
    }

    .champion-icon {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      max-width: none;
    }

    .champion-icon-stretched {
      width: 112%;
      height: 112%;
    }

    .champion-icon-ring {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-style: solid;
      box-sizing: border-box;

      &.round {
        border-radius: 50%;
      }
    }
  }
}
</style>
