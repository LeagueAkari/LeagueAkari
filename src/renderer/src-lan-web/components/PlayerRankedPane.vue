<template>
  <div v-if="ranked === null" class="ranked-unavailable">
    {{ labels.rankedUnavailable }}
  </div>
  <div v-else class="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
    <div v-for="queueType in queueTypes" :key="queueType" class="ranked-card">
      <div class="absolute top-1 left-2 flex max-w-full items-center gap-1.5 text-xs opacity-55">
        <span>{{ queueType === 'RANKED_SOLO_5x5' ? labels.rankedSolo : labels.rankedFlex }}</span>
        <span
          v-if="entryFor(queueType)"
          class="rounded bg-black/8 px-1.5 py-px text-[10px] leading-4 dark:bg-white/10"
        >
          {{ labels.winRate }} {{ entryWinRate(entryFor(queueType)) }}
        </span>
      </div>
      <img
        class="h-18 w-22 shrink-0 object-contain"
        :src="rankedIcon(entryFor(queueType)?.tier)"
        alt=""
      />
      <div class="min-w-0">
        <div class="font-bold">{{ formatTier(entryFor(queueType)) }}</div>
        <div v-if="entryFor(queueType)" class="text-xs opacity-60">
          {{ entryFor(queueType)?.wins }}{{ labels.wins }} {{ entryFor(queueType)?.losses
          }}{{ labels.losses }} · {{ entryFor(queueType)?.leaguePoints }} {{ labels.lp }}
        </div>
        <div class="mt-0.5 text-[11px] opacity-45">
          {{ labels.highest }} {{ formatHighest(entryFor(queueType)) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import RankedBronze from '@renderer-shared/assets/ranked-icons-large/bronze.png'
import RankedChallenger from '@renderer-shared/assets/ranked-icons-large/challenger.png'
import RankedDiamond from '@renderer-shared/assets/ranked-icons-large/diamond.png'
import RankedEmerald from '@renderer-shared/assets/ranked-icons-large/emerald.png'
import RankedGold from '@renderer-shared/assets/ranked-icons-large/gold.png'
import RankedGrandmaster from '@renderer-shared/assets/ranked-icons-large/grandmaster.png'
import RankedIron from '@renderer-shared/assets/ranked-icons-large/iron.png'
import RankedMaster from '@renderer-shared/assets/ranked-icons-large/master.png'
import RankedPlatinum from '@renderer-shared/assets/ranked-icons-large/platinum.png'
import RankedSilver from '@renderer-shared/assets/ranked-icons-large/silver.png'
import RankedNone from '@renderer-shared/assets/ranked-icons-large/unranked.png'
import type { LanWebRankedEntryDto } from '@shared/shards/lan-web'

import type { LanWebLabels } from '../labels'
import { tierName } from '../rank'

const props = defineProps<{ ranked: LanWebRankedEntryDto[] | null; labels: LanWebLabels }>()
const queueTypes = ['RANKED_SOLO_5x5', 'RANKED_FLEX_SR'] as const
const icons: Record<string, string> = {
  IRON: RankedIron,
  BRONZE: RankedBronze,
  SILVER: RankedSilver,
  GOLD: RankedGold,
  PLATINUM: RankedPlatinum,
  EMERALD: RankedEmerald,
  DIAMOND: RankedDiamond,
  MASTER: RankedMaster,
  GRANDMASTER: RankedGrandmaster,
  CHALLENGER: RankedChallenger
}

function entryFor(queueType: LanWebRankedEntryDto['queueType']) {
  return props.ranked?.find((entry) => entry.queueType === queueType)
}

function isUnranked(value?: string) {
  return !value || value === 'NA' || value === 'NONE'
}

function rankedIcon(tier?: string) {
  return (tier && icons[tier]) || RankedNone
}

function formatTier(entry?: LanWebRankedEntryDto) {
  if (!entry || isUnranked(entry.tier)) return props.labels.unranked
  return `${tierName(entry.tier)} ${isUnranked(entry.division) ? '' : entry.division}`.trim()
}

function formatHighest(entry?: LanWebRankedEntryDto) {
  if (!entry || isUnranked(entry.highestTier)) return props.labels.unranked
  return `${tierName(entry.highestTier)} ${isUnranked(entry.highestDivision) ? '' : entry.highestDivision}`.trim()
}

function entryWinRate(entry?: LanWebRankedEntryDto) {
  if (!entry) return '0.0%'
  const total = entry.wins + entry.losses
  return `${(total ? (entry.wins / total) * 100 : 0).toFixed(1)}%`
}
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

.ranked-card {
  @apply relative flex h-27 min-w-0 items-center justify-center gap-1 rounded-lg bg-black/5 pt-3 dark:bg-white/5;
}

.ranked-unavailable {
  @apply flex min-h-27 items-center justify-center rounded-lg bg-black/5 px-4 text-center text-xs opacity-55 dark:bg-white/5;
}
</style>
