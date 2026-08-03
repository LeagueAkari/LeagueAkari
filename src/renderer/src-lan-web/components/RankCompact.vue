<template>
  <div class="flex min-w-0 flex-1 items-center justify-start">
    <img v-if="entry && icon" class="mr-1 size-3.5" :src="icon" alt="rank" />
    <span class="truncate text-[11px] text-black/70 dark:text-white/70">
      {{ entry ? tierText : unranked }}
    </span>
  </div>
</template>

<script setup lang="ts">
import Bronze from '@renderer-shared/assets/ranked-icons/bronze.png'
import Challenger from '@renderer-shared/assets/ranked-icons/challenger.png'
import Diamond from '@renderer-shared/assets/ranked-icons/diamond.png'
import Emerald from '@renderer-shared/assets/ranked-icons/emerald.png'
import Gold from '@renderer-shared/assets/ranked-icons/gold.png'
import Grandmaster from '@renderer-shared/assets/ranked-icons/grandmaster.png'
import Iron from '@renderer-shared/assets/ranked-icons/iron.png'
import Master from '@renderer-shared/assets/ranked-icons/master.png'
import Platinum from '@renderer-shared/assets/ranked-icons/platinum.png'
import Silver from '@renderer-shared/assets/ranked-icons/silver.png'
import type { LanWebRankedEntryDto } from '@shared/shards/lan-web'
import { computed } from 'vue'

import { tierName } from '../rank'

const props = defineProps<{ entry?: LanWebRankedEntryDto; unranked: string }>()
const icons: Record<string, string> = {
  IRON: Iron,
  BRONZE: Bronze,
  SILVER: Silver,
  GOLD: Gold,
  PLATINUM: Platinum,
  EMERALD: Emerald,
  DIAMOND: Diamond,
  MASTER: Master,
  GRANDMASTER: Grandmaster,
  CHALLENGER: Challenger
}
const icon = computed(() => (props.entry ? icons[props.entry.tier] : undefined))
const tierText = computed(() => {
  if (!props.entry) return props.unranked
  const division =
    props.entry.division && props.entry.division !== 'NA' ? ` ${props.entry.division}` : ''
  return `${tierName(props.entry.tier, true)}${division} ${props.entry.leaguePoints}`
})
</script>
