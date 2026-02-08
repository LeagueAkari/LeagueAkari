<template>
  <div class="relative" :style="{ width: `${size}px`, height: `${size}px` }">
    <div
      v-for="point of mappedPoints"
      class="absolute z-20 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300"
      :style="{
        left: `${point.left}px`,
        top: `${point.top}px`
      }"
      :class="{ 'transition-[left,top] duration-100': transition }"
    ></div>

    <!-- map bg -->
    <img class="absolute h-full w-full" :src="map11" v-if="mapId === 11" />
    <img class="absolute h-full w-full" :src="map12" v-else-if="mapId === 12" />
    <img class="absolute h-full w-full" :src="map21" v-else-if="mapId === 21" />
    <div class="absolute h-full w-full bg-gray-700" v-else></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import map11 from '../map-images/11.png'
import map12 from '../map-images/12.png'
import map21 from '../map-images/21.png'
import { type MapId, mapToImagePosition } from '../utils/game-map'

const {
  mapId = 11,
  points = [],
  size = 350,
  transition = false
} = defineProps<{
  size?: number
  mapId?: number
  points?: Coordinate[]
  transition?: boolean
}>()

type Coordinate = {
  x: number
  y: number
}

const mappedPoints = computed(() => {
  return points.map((point) => {
    return mapToImagePosition(point.x, point.y, size, size, mapId as MapId)
  })
})
</script>
