<template>
  <span class="flex items-center gap-1 text-xs leading-[inherit] whitespace-nowrap">
    <PositionIcon v-if="position" :position="position" class="shrink-0 text-sm" />
    <img v-else-if="rankIcon" :src="rankIcon" class="size-4 shrink-0 object-contain" alt="" />
    <span v-else-if="flag" aria-hidden="true" class="shrink-0 text-base leading-none">{{
      flag
    }}</span>
    <NIcon v-else-if="icon" class="shrink-0" :size="14">
      <Globe v-if="icon === 'region'" />
      <Trophy v-else />
    </NIcon>
    <span>{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import BronzeMedal from '@renderer-shared/assets/ranked-icons/bronze.png'
import ChallengerMedal from '@renderer-shared/assets/ranked-icons/challenger.png'
import DiamondMedal from '@renderer-shared/assets/ranked-icons/diamond.png'
import EmeraldMedal from '@renderer-shared/assets/ranked-icons/emerald.png'
import GoldMedal from '@renderer-shared/assets/ranked-icons/gold.png'
import GrandmasterMedal from '@renderer-shared/assets/ranked-icons/grandmaster.png'
import IronMedal from '@renderer-shared/assets/ranked-icons/iron.png'
import MasterMedal from '@renderer-shared/assets/ranked-icons/master.png'
import PlatinumMedal from '@renderer-shared/assets/ranked-icons/platinum.png'
import SilverMedal from '@renderer-shared/assets/ranked-icons/silver.png'
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import Globe from '@vicons/ionicons5/es/GlobeOutline'
import Trophy from '@vicons/ionicons5/es/TrophyOutline'
import { NIcon } from 'naive-ui'
import { computed } from 'vue'

const { label, icon, position, rank, flag } = defineProps<{
  label: string
  icon?: 'region' | 'tier'
  position?: string
  rank?: string
  flag?: string
}>()

const medals: Record<string, string> = {
  iron: IronMedal,
  bronze: BronzeMedal,
  silver: SilverMedal,
  gold: GoldMedal,
  platinum: PlatinumMedal,
  emerald: EmeraldMedal,
  diamond: DiamondMedal,
  master: MasterMedal,
  grandmaster: GrandmasterMedal,
  challenger: ChallengerMedal
}
const rankIcon = computed(() => (rank ? medals[rank] : undefined))
</script>
