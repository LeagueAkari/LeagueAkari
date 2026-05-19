<template>
  <div class="relative shrink-0" :style="{ width: `${size}px`, height: `${size}px` }">
    <img class="absolute h-full w-full rounded" :src="map11" />
    <svg class="absolute h-full w-full rounded" viewBox="0 0 100 100">
      <polygon v-if="showSideFill" points="0,0 100,100 0,100" fill="rgba(60,140,255,0.08)" />
      <polygon v-if="showSideFill" points="0,0 100,100 100,0" fill="rgba(255,60,60,0.08)" />
      <line
        x1="0"
        y1="0"
        x2="100"
        y2="100"
        stroke="rgba(255,255,255,0.35)"
        :stroke-width="showSideFill ? 0.8 : 1"
        stroke-dasharray="4,3"
      />
    </svg>
    <div v-if="heatmap" class="pointer-events-none absolute inset-0 overflow-hidden rounded">
      <div
        v-for="cell of heatmapCells"
        :key="cell.key"
        class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50 shadow-[0_0_0_1px_rgba(0,0,0,0.16)]"
        :class="laneHeatmapCellColors[cell.lane]"
        :style="heatmapCellStyle(cell)"
      />
    </div>
    <template v-else>
      <div
        v-for="(pt, i) of positionMapPoints"
        :key="`position-${i}`"
        class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60"
        :class="[lanePositionDotColors[pt.lane], effectivePositionDotSizeClass]"
        :style="{ left: `${pt.left}px`, top: `${pt.top}px` }"
      />
      <div
        v-for="(pt, i) of killMapPoints"
        :key="`kill-${i}`"
        class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
        :class="killMarkerSizeClass"
        :style="{ left: `${pt.left}px`, top: `${pt.top}px` }"
      >
        <span
          class="absolute top-1/2 left-1/2 h-0.5 w-full -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-sm"
          :class="laneKillMarkerColors[pt.lane]"
        />
        <span
          class="absolute top-1/2 left-1/2 h-0.5 w-full -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm"
          :class="laneKillMarkerColors[pt.lane]"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import map11 from '@renderer-shared/components/match-card/map-images/11.png'
import { mapToImagePosition } from '@renderer-shared/components/match-card/utils/game-map'
import { computed } from 'vue'

import type { GankMapHeatmapAccumulator, GankMapHeatmapCell, MapLanePoint } from './types'

const {
  points = [],
  positionPoints = [],
  killPoints,
  size,
  limit = Infinity,
  positionLimit = Infinity,
  killLimit,
  balanceByLane = false,
  showSideFill = false,
  heatmap = false,
  heatmapGridSize = 7,
  heatmapCellLimit = 14,
  dotSizeClass = 'h-1.5 w-1.5',
  positionDotSizeClass,
  killMarkerSizeClass = 'h-3 w-3'
} = defineProps<{
  points?: MapLanePoint[]
  positionPoints?: MapLanePoint[]
  killPoints?: MapLanePoint[]
  size: number
  limit?: number
  positionLimit?: number
  killLimit?: number
  balanceByLane?: boolean
  showSideFill?: boolean
  heatmap?: boolean
  heatmapGridSize?: number
  heatmapCellLimit?: number
  dotSizeClass?: string
  positionDotSizeClass?: string
  killMarkerSizeClass?: string
}>()

const LANE_ORDER = ['top', 'mid', 'bot'] as const satisfies readonly MapLanePoint['lane'][]
const HEATMAP_POSITION_WEIGHT = 1
const HEATMAP_KILL_WEIGHT = 5

const lanePositionDotColors: Record<MapLanePoint['lane'], string> = {
  top: 'bg-red-600/65 dark:bg-red-400/55',
  mid: 'bg-amber-500/70 dark:bg-yellow-400/55',
  bot: 'bg-blue-600/65 dark:bg-blue-400/55'
}

const laneKillMarkerColors: Record<MapLanePoint['lane'], string> = {
  top: 'bg-red-600 dark:bg-red-400',
  mid: 'bg-amber-500 dark:bg-yellow-400',
  bot: 'bg-blue-600 dark:bg-blue-400'
}

const laneHeatmapCellColors: Record<MapLanePoint['lane'], string> = {
  top: 'bg-red-600 dark:bg-red-400',
  mid: 'bg-amber-500 dark:bg-yellow-400',
  bot: 'bg-blue-600 dark:bg-blue-400'
}

const sampleEvenly = (source: MapLanePoint[], count: number) => {
  if (count >= source.length) {
    return source
  }

  if (count <= 0) {
    return []
  }

  if (count === 1) {
    return [source[Math.floor((source.length - 1) / 2)]]
  }

  return Array.from({ length: count }, (_, index) => {
    const sourceIndex = Math.round((index * (source.length - 1)) / (count - 1))

    return source[sourceIndex]
  })
}

const bucketPointsByLane = (source: MapLanePoint[]) => {
  const buckets: Record<MapLanePoint['lane'], MapLanePoint[]> = {
    top: [],
    mid: [],
    bot: []
  }

  for (const point of source) {
    buckets[point.lane].push(point)
  }

  return buckets
}

const balancePointsByLane = (source: MapLanePoint[], maxCount: number) => {
  const buckets = bucketPointsByLane(source)
  const activeLanes = LANE_ORDER.filter((lane) => buckets[lane].length > 0)
  const pickedCounts: Record<MapLanePoint['lane'], number> = { top: 0, mid: 0, bot: 0 }

  if (activeLanes.length === 0 || maxCount <= 0) {
    return []
  }

  const baseQuota = maxCount >= activeLanes.length ? Math.floor(maxCount / activeLanes.length) : 0
  for (const lane of activeLanes) {
    pickedCounts[lane] = Math.min(baseQuota, buckets[lane].length)
  }

  let remaining = maxCount - activeLanes.reduce((sum, lane) => sum + pickedCounts[lane], 0)
  while (remaining > 0) {
    const candidates = activeLanes
      .filter((lane) => pickedCounts[lane] < buckets[lane].length)
      .sort((a, b) => {
        const remainingDiff =
          buckets[b].length - pickedCounts[b] - (buckets[a].length - pickedCounts[a])

        return remainingDiff || buckets[b].length - buckets[a].length
      })

    if (candidates.length === 0) {
      break
    }

    for (const lane of candidates) {
      if (remaining <= 0) {
        break
      }

      pickedCounts[lane]++
      remaining--
    }
  }

  const selected = new Set<MapLanePoint>()
  for (const lane of activeLanes) {
    for (const point of sampleEvenly(buckets[lane], pickedCounts[lane])) {
      selected.add(point)
    }
  }

  return source.filter((point) => selected.has(point))
}

const limitPoints = (source: MapLanePoint[], maxCount: number) => {
  if (!Number.isFinite(maxCount) || source.length <= maxCount) {
    return source
  }

  const normalizedLimit = Math.max(0, Math.floor(maxCount))

  if (!balanceByLane) {
    return source.slice(0, normalizedLimit)
  }

  return balancePointsByLane(source, normalizedLimit)
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const addHeatmapPoint = (
  cells: Map<string, GankMapHeatmapAccumulator>,
  point: MapLanePoint,
  weight: number,
  gridSize: number
) => {
  const { left, top } = mapToImagePosition(point.x, point.y, size, size, 11)
  const cellX = clamp(Math.floor((left / size) * gridSize), 0, gridSize - 1)
  const cellY = clamp(Math.floor((top / size) * gridSize), 0, gridSize - 1)
  const key = `${cellX}:${cellY}`
  const current = cells.get(key) ?? {
    weight: 0,
    leftSum: 0,
    topSum: 0,
    laneWeights: { top: 0, mid: 0, bot: 0 }
  }

  current.weight += weight
  current.leftSum += left * weight
  current.topSum += top * weight
  current.laneWeights[point.lane] += weight
  cells.set(key, current)
}

const dominantLane = (cell: GankMapHeatmapAccumulator): MapLanePoint['lane'] => {
  return LANE_ORDER.reduce((bestLane, lane) => {
    return cell.laneWeights[lane] > cell.laneWeights[bestLane] ? lane : bestLane
  }, LANE_ORDER[0])
}

const effectiveKillPoints = computed(() => killPoints ?? points)
const effectivePositionDotSizeClass = computed(() => positionDotSizeClass ?? dotSizeClass)
const limitedPositionPoints = computed(() => limitPoints(positionPoints, positionLimit))
const limitedKillPoints = computed(() => limitPoints(effectiveKillPoints.value, killLimit ?? limit))

const positionMapPoints = computed(() => {
  return limitedPositionPoints.value.map((pt) => ({
    ...mapToImagePosition(pt.x, pt.y, size, size, 11),
    lane: pt.lane
  }))
})

const killMapPoints = computed(() => {
  return limitedKillPoints.value.map((pt) => ({
    ...mapToImagePosition(pt.x, pt.y, size, size, 11),
    lane: pt.lane
  }))
})

const heatmapCells = computed<GankMapHeatmapCell[]>(() => {
  const gridSize = Math.max(1, Math.floor(heatmapGridSize))
  const cells = new Map<string, GankMapHeatmapAccumulator>()

  for (const point of positionPoints) {
    addHeatmapPoint(cells, point, HEATMAP_POSITION_WEIGHT, gridSize)
  }

  for (const point of effectiveKillPoints.value) {
    addHeatmapPoint(cells, point, HEATMAP_KILL_WEIGHT, gridSize)
  }

  const sortedCells = Array.from(cells.entries()).sort((a, b) => b[1].weight - a[1].weight)
  const visibleCells = Number.isFinite(heatmapCellLimit)
    ? sortedCells.slice(0, Math.max(0, Math.floor(heatmapCellLimit)))
    : sortedCells
  const maxWeight = sortedCells[0]?.[1].weight ?? 0
  const baseCellSize = size / gridSize

  if (maxWeight <= 0) {
    return []
  }

  return visibleCells
    .map(([key, cell]) => {
      const intensity = cell.weight / maxWeight

      return {
        key,
        left: cell.leftSum / cell.weight,
        top: cell.topSum / cell.weight,
        lane: dominantLane(cell),
        size: clamp(baseCellSize * (0.45 + intensity * 0.9), 3, 8),
        opacity: 0.28 + intensity * 0.5,
        intensity
      }
    })
    .sort((a, b) => a.intensity - b.intensity)
})

const heatmapCellStyle = (cell: GankMapHeatmapCell) => ({
  left: `${cell.left}px`,
  top: `${cell.top}px`,
  width: `${cell.size}px`,
  height: `${cell.size}px`,
  opacity: cell.opacity
})
</script>
