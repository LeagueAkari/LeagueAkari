<template>
  <div class="champion-header">
    <div class="relative flex min-w-0 flex-1 items-center gap-3 self-start">
      <ChampionIcon
        round
        class="size-14 shrink-0 ring-2"
        :champion-id="championId"
        :style="{ '--tw-ring-color': getTierColors(tier).color }"
      />
      <div class="min-w-0">
        <div class="flex min-w-0 items-center gap-1">
          <span class="min-w-0 text-xl leading-7 font-bold wrap-break-word">{{
            resources.champions.name(championId)
          }}</span>
          <TierBadge v-if="tier != null" class="relative top-0.5" :tier="tier" />
        </div>
        <div
          v-if="position"
          class="mt-1 flex items-center gap-1 text-[13px] text-black/80 dark:text-white/80"
        >
          <PositionIcon :position="position.value" class="shrink-0 text-sm" aria-hidden="true" />
          <span>{{ position.label }}</span>
        </div>
      </div>
    </div>
    <div v-if="$slots.default" class="champion-header-stats"><slot /></div>
  </div>
</template>
<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import TierBadge from '../champion-statistics/TierBadge.vue'
import { useTierTheme } from '../champion-statistics/theme'

defineProps<{
  championId: number
  tier: number | null
  position: { value: string; label: string } | null
}>()
const resources = useAkariResourceProvider()
const { getTierColors } = useTierTheme()
</script>
<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';
.champion-header {
  @apply relative col-span-full box-border flex min-h-28 min-w-0 justify-between gap-4 overflow-hidden border-b border-black/8 px-3 py-3 dark:border-white/8;
}
.champion-header-stats {
  @apply relative flex w-54 shrink-0 flex-wrap-reverse justify-end gap-x-3 gap-y-1 self-end;
}
</style>
