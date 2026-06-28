<template>
  <div class="relative">
    <NScrollbar ref="scrollbarRef" x-scrollable class="max-h-142">
      <div ref="contentRef">
        <!-- Players -->
        <div
          v-for="p of sortedParticipants"
          :key="p.puuid"
          :data-runes-participant-id="p.participantId"
          class="rounded-lg bg-black/3 p-3 pr-12 not-last:mb-2 dark:bg-white/3"
        >
          <!-- Player Header -->
          <div class="mb-1 flex items-center gap-2">
            <ChampionIcon
              :champion-id="p.championId"
              class="size-7! shrink-0 border-2 border-solid"
              :style="{
                borderColor: getTeamColor(p.teamIdentifier)
              }"
              round
            />
            <div class="min-w-0 truncate text-sm font-medium">{{ participantName(p) }}</div>
            <div v-if="p.position && p.position.toLowerCase() !== 'invalid'" :class="tagTheme">
              {{ position(p.position) }}
            </div>

            <div v-if="playerPerks[p.participantId].statPerks" class="ml-2 flex gap-2">
              <PerkDisplay
                v-for="statPerkId of playerPerks[p.participantId].statPerks"
                class="rounded-full ring-2"
                :class="getPerkStyleRingColor(-1)"
                :perk-id="statPerkId"
                :size="16"
              />
            </div>
          </div>

          <!-- divider -->
          <div class="my-3 h-px bg-black/10 dark:bg-white/10"></div>

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
                class="rounded-full ring-2"
                :class="getPerkStyleRingColor(perk.styleId)"
              />

              <div>
                <div class="mb-2 text-sm font-bold text-black dark:text-white">
                  {{ lcs.gameData.perkName(perk.perkId) }}
                </div>

                <div
                  v-for="desc of perk.descriptions"
                  :key="desc"
                  class="flex flex-wrap items-center text-sm text-black/80 not-last:mb-1 dark:text-white/80"
                >
                  <div
                    class="mr-2 size-2 rotate-45 rounded-sm"
                    :class="getPerkStyleIndicatorColor(perk.styleId)"
                  ></div>
                  <div class="text-sm!" lol-view v-html="desc" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NScrollbar>

    <div
      class="absolute top-2 right-2 z-10 box-border flex max-h-[calc(100%-1rem)] flex-col overflow-hidden rounded border border-black/10 bg-neutral-100/95 p-1 opacity-45 shadow-lg shadow-black/10 transition-[width,opacity] focus-within:opacity-100 hover:opacity-100 dark:border-white/10 dark:bg-neutral-900/95 dark:shadow-black/30"
      :class="isNavigatorExpanded ? 'w-40' : 'w-11'"
    >
      <NButton
        class="mb-2! self-center"
        circle
        secondary
        size="tiny"
        :focusable="false"
        @click="isNavigatorExpanded = !isNavigatorExpanded"
      >
        <template #icon>
          <NIcon>
            <ChevronRight20Regular v-if="isNavigatorExpanded" />
            <ChevronLeft20Regular v-else />
          </NIcon>
        </template>
      </NButton>

      <div
        class="match-card-participant-navigator-list min-h-0 space-y-1 overflow-x-hidden overflow-y-auto"
      >
        <NTooltip
          v-for="p of sortedParticipants"
          :key="p.puuid"
          placement="left"
          :disabled="isNavigatorExpanded"
        >
          <template #trigger>
            <button
              type="button"
              class="box-border flex h-7 w-full cursor-pointer items-center gap-2 rounded border-0 p-0 text-left text-black/80 transition-colors dark:text-white/80"
              :class="[
                isNavigatorExpanded ? 'justify-start px-1' : 'justify-center',
                'bg-transparent hover:bg-black/8 dark:hover:bg-white/10'
              ]"
              @click="scrollToParticipant(p.participantId)"
            >
              <ChampionIcon
                :champion-id="p.championId"
                class="size-6! shrink-0 border-2 border-solid"
                :style="{
                  borderColor: getTeamColor(p.teamIdentifier)
                }"
                round
              />
              <span v-if="isNavigatorExpanded" class="min-w-0 flex-1 truncate text-xs">
                {{ participantName(p) }}
              </span>
            </button>
          </template>
          {{ participantName(p) }}
        </NTooltip>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import PerkDisplay from '@renderer-shared/components/widgets/PerkDisplay.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { ChevronLeft20Regular, ChevronRight20Regular } from '@vicons/fluent'
import { NButton, NIcon, NScrollbar, NTooltip } from 'naive-ui'
import { computed, ref } from 'vue'

import { useMatchCard } from '../context'
import { usePosition } from '../utils/text'
import { getTeamColor, useWinResultTagClass } from '../utils/theme'

const { basicInfo, participants, team, hidePrivacy } = useMatchCard()

const lcs = useLeagueClientStore()
const position = usePosition()
const tagTheme = useWinResultTagClass(() => team.value?.winResult)

const scrollbarRef = ref<InstanceType<typeof NScrollbar> | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const isNavigatorExpanded = ref(false)

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

type Participant = (typeof participants.value)[number]

const participantName = (participant: Participant) => {
  if (hidePrivacy.value) {
    return lcs.gameData.championName(participant.championId)
  }

  return participant.tagLine
    ? `${participant.gameName} #${participant.tagLine}`
    : participant.gameName
}

const scrollToParticipant = (participantId: number) => {
  const target = contentRef.value?.querySelector<HTMLElement>(
    `[data-runes-participant-id="${participantId}"]`
  )

  if (!target) {
    return
  }

  scrollbarRef.value?.scrollTo({
    top: Math.max(target.offsetTop - 8, 0),
    behavior: 'smooth'
  })
}

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
</script>

<style scoped>
.match-card-participant-navigator-list {
  scrollbar-color: rgba(0, 0, 0, 0.24) transparent;
  scrollbar-width: thin;
}

.match-card-participant-navigator-list::-webkit-scrollbar {
  width: 4px;
}

.match-card-participant-navigator-list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background-color: rgba(0, 0, 0, 0.24);
}

.match-card-participant-navigator-list::-webkit-scrollbar-track {
  background-color: transparent;
}

:global([data-theme='dark'] .match-card-participant-navigator-list) {
  scrollbar-color: rgba(255, 255, 255, 0.24) transparent;
}

:global([data-theme='dark'] .match-card-participant-navigator-list::-webkit-scrollbar-thumb) {
  background-color: rgba(255, 255, 255, 0.24);
}
</style>
