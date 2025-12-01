<template>
  <NScrollbar x-scrollable class="max-h-142">
    <!-- Players -->
    <div
      v-for="p of sortedParticipants"
      :key="p.puuid"
      class="dark:bg-white/3 bg-black/3 rounded-lg p-3 not-last:mb-2"
    >
      <!-- Player Header -->
      <div class="flex items-center gap-2 mb-3">
        <ChampionIcon
          :champion-id="p.championId"
          class="!size-7 shrink-0 b-2 b-solid"
          :style="{
            borderColor: getTeamColor(p.teamIdentifier)
          }"
          round
        />
        <div class="text-sm font-medium truncate min-w-0">{{ p.gameName }} #{{ p.tagLine }}</div>

        <div v-if="playerPerks[p.participantId].statPerks" class="flex gap-2 ml-2">
          <PerkDisplay
            v-for="statPerkId of playerPerks[p.participantId].statPerks"
            class="ring-2 rounded-full"
            :class="getPerkStyleRingColor(-1)"
            :perk-id="statPerkId"
            :size="16"
          />
        </div>
      </div>

      <!-- divider -->
      <div class="h-px bg-black/10 dark:bg-white/10 my-3"></div>

      <!-- perks -->
      <div
        v-for="perk of playerPerks[p.participantId].perks"
        :key="perk.perkId"
        class="not-last:mb-4"
      >
        <div class="flex gap-4">
          <PerkDisplay
            :perk-id="perk.perkId"
            :size="24"
            class="ring-2 rounded-full"
            :class="getPerkStyleRingColor(perk.styleId)"
          />

          <div>
            <div class="text-sm font-bold dark:text-white text-black mb-2">
              {{ lcs.gameData.perkName(perk.perkId) }}
            </div>

            <div
              v-for="desc of perk.descriptions"
              :key="desc"
              class="text-sm text-black/80 dark:text-white/80 not-last:mb-1 flex items-center flex-wrap"
            >
              <div
                class="rotate-45 rounded-sm size-2 mr-2"
                :class="getPerkStyleIndicatorColor(perk.styleId)"
              ></div>
              <span>{{ desc }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NScrollbar>
</template>

<script lang="ts" setup>
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import PerkDisplay from '@renderer-shared/components/widgets/PerkDisplay.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { NScrollbar } from 'naive-ui'
import { computed, watchEffect } from 'vue'

import { useMatchCard } from '../context'
import { getTeamColor } from '../utils/theme'

const { basicInfo, participants } = useMatchCard()

const lcs = useLeagueClientStore()

const sortedParticipants = computed(() => {
  if (basicInfo.value.isCherrySubteam) {
    return participants.value.toSorted((a, b) => {
      return a.subteamPlacement - b.subteamPlacement
    })
  }

  return participants.value.toSorted((a, b) => {
    return a.teamIdentifier.localeCompare(b.teamIdentifier)
  })
})

const EOG_PLACEHOLDER_PATTERN = /@eogvar(\d+)@/g

interface PlayerPerkStats {
  perks: {
    perkId: number
    descriptions: string[]
    styleId: number
  }[]
  statPerks: number[] | null
}

const playerPerks = computed(() => {
  const perkMap = lcs.gameData.perks
  const perkStats: Record<number, PlayerPerkStats> = {}

  for (const p of participants.value) {
    const { statPerks, styles } = p.perks

    const mapped = styles.flatMap((style) => {
      return style.selections
        .map((selection) => {
          const perk = perkMap[selection.perk]

          if (!perk) {
            return null
          }

          const descriptions = perk.endOfGameStatDescs.map((desc) => {
            return desc.replace(EOG_PLACEHOLDER_PATTERN, (_, varIndex) => {
              switch (varIndex) {
                case '1':
                  return selection.var1.toString()
                case '2':
                  return selection.var2.toString()
                case '3':
                  return selection.var3.toString()
                default:
                  return _
              }
            })
          })

          return {
            perkId: selection.perk,
            descriptions,
            styleId: style.style
          }
        })
        .filter((v) => v !== null)
    })

    perkStats[p.participantId] = {
      perks: mapped,
      statPerks: statPerks ? [statPerks.offense, statPerks.flex, statPerks.defense] : null
    }
  }

  return perkStats
})

const getPerkStyleRingColor = (styleId: number) => {
  switch (styleId) {
    case 8000: // Precision
      return 'ring-amber-700/60 dark:ring-amber-500/60'
    case 8100: // Domination
      return 'ring-red-700/60 dark:ring-red-500/60'
    case 8200: // Sorcery
      return 'ring-violet-700/60 dark:ring-violet-500/60'
    case 8300: // Inspiration
      return 'ring-cyan-700/60 dark:ring-cyan-500/60'
    case 8400: // Resolve
      return 'ring-emerald-700/60 dark:ring-emerald-500/60'
    default:
      return 'ring-gray-500/80'
  }
}

const getPerkStyleIndicatorColor = (styleId: number) => {
  switch (styleId) {
    case 8000: // Precision
      return 'bg-amber-700/80 dark:bg-amber-500/80'
    case 8100: // Domination
      return 'bg-red-700/80 dark:bg-red-500/80'
    case 8200: // Sorcery
      return 'bg-violet-700/80 dark:bg-violet-500/80'
    case 8300: // Inspiration
      return 'bg-cyan-700/80 dark:bg-cyan-500/80'
    case 8400: // Resolve
      return 'bg-emerald-700/80 dark:bg-emerald-500/80'
    default:
      return 'bg-gray-500/80'
  }
}

watchEffect(() => {
  console.log(playerPerks.value)
})
</script>
