<template>
  <div class="relative" :style="{ width: `${size}px`, height: `${size}px` }">
    <div
      v-for="point of mappedPoints"
      :key="point.left + point.top"
      class="absolute rounded-full bg-blue-300 size-1.5 z-20 -translate-x-1/2 -translate-y-1/2"
      :style="{
        left: `${point.left}px`,
        top: `${point.top}px`
      }"
    ></div>

    <!-- map bg -->
    <img class="h-full w-full absolute" :src="map11" v-if="mapId === 11" />
    <img class="h-full w-full absolute" :src="map12" v-else-if="mapId === 12" />
    <img class="h-full w-full absolute" :src="map21" v-else-if="mapId === 21" />
    <div class="h-full w-full absolute bg-gray-700" v-else></div>
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
  size = 200
} = defineProps<{
  size?: number
  mapId?: number
  points?: Coordinate[]
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
