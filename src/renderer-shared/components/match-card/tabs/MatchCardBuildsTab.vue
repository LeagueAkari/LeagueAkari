<template>
  <NScrollbar x-scrollable class="max-h-142" v-if="details">
    <!-- Players -->
    <div
      v-for="p of sortedParticipants"
      :key="p.puuid"
      class="rounded-lg bg-black/3 p-3 not-last:mb-2 dark:bg-white/3"
    >
      <!-- Player Header -->
      <div
        class="mb-1 flex cursor-pointer items-center gap-2 select-none"
        @click="toggleParticipantExpanded(p.participantId)"
      >
        <ChampionIcon
          :champion-id="p.championId"
          class="size-7! shrink-0 border-2 border-solid"
          :style="{
            borderColor: getTeamColor(p.teamIdentifier)
          }"
          round
        />
        <div class="min-w-0 truncate text-sm font-medium text-black dark:text-white">
          <template v-if="hidePrivacy">
            {{ lcs.gameData.championName(p.championId) }}
          </template>
          <template v-else> {{ p.gameName }} #{{ p.tagLine }} </template>
        </div>
        <div v-if="p.position && p.position.toLowerCase() !== 'invalid'" :class="tagTheme">
          {{ position(p.position) }}
        </div>

        <!-- anvil -->
        <div
          v-if="collected.anvils[p.participantId] && collected.anvils[p.participantId] > 0"
          class="rounded bg-black/20 px-1 py-0.5 text-xs text-black/80 dark:bg-white/10 dark:text-white"
        >
          {{ t('MatchCard.buildsTab.anvils', { count: collected.anvils[p.participantId] }) }}
        </div>

        <NIcon
          class="ml-auto transition-transform duration-150"
          :class="{ 'rotate-90': isParticipantExpanded(p.participantId) }"
          size="16"
        >
          <ChevronRight20Regular />
        </NIcon>
      </div>

      <NCollapseTransition :show="isParticipantExpanded(p.participantId)">
        <!-- divider -->
        <div class="my-3 h-px bg-black/10 dark:bg-white/10"></div>

        <!-- Skills Section -->
        <div class="mb-3">
          <div class="mb-1.5 text-xs text-black/80 dark:text-white/50">
            {{ t('MatchCard.buildsTab.skillBuild') }}
          </div>
          <div class="flex flex-wrap items-center gap-1">
            <div
              v-for="(sk, idx) of collected.skillLevelUpEvents[p.participantId]"
              :key="idx"
              class="relative"
            >
              <div
                v-if="sk.levelUpType === 'EVOLVE'"
                class="relative flex size-6 cursor-default items-center justify-center rounded-full border border-solid border-rose-500 bg-rose-500/60 text-xs font-bold dark:border-rose-400/60 dark:bg-rose-400/60"
                :title="`${sk.displayLevel ? sk.displayLevel + ' - ' : ''}${SKILL_SLOT_TRANSLATIONS[sk.skillSlot as keyof typeof SKILL_SLOT_TRANSLATIONS]} (${t('MatchCard.buildsTab.evolved')}) - ${formatMilliseconds(sk.timestamp)}`"
              >
                {{
                  SKILL_SLOT_TRANSLATIONS[sk.skillSlot as keyof typeof SKILL_SLOT_TRANSLATIONS] ||
                  'U'
                }}
                <div
                  class="absolute -top-1 -right-1 flex size-3 items-center justify-center rounded-full border border-solid border-white bg-amber-400 text-black shadow-sm dark:border-neutral-900 dark:bg-amber-500"
                >
                  <NIcon size="10"><ArrowUp /></NIcon>
                </div>
              </div>
              <div
                v-else
                class="flex size-6 cursor-default items-center justify-center rounded text-xs font-bold"
                :class="getClassBySkillSlot(sk.skillSlot)"
                :title="`${sk.displayLevel} - ${SKILL_SLOT_TRANSLATIONS[sk.skillSlot as keyof typeof SKILL_SLOT_TRANSLATIONS]} - ${formatMilliseconds(sk.timestamp)}`"
              >
                {{
                  SKILL_SLOT_TRANSLATIONS[sk.skillSlot as keyof typeof SKILL_SLOT_TRANSLATIONS] ||
                  'U'
                }}
              </div>

              <div
                v-if="sk.displayLevel"
                class="absolute -right-1 -bottom-1 z-1 min-w-3 rounded bg-black/60 py-0.5 text-center text-[8px] leading-none text-white"
              >
                {{ sk.displayLevel }}
              </div>
            </div>

            <!-- Empty state -->
            <div
              v-if="!collected.skillLevelUpEvents[p.participantId]?.length"
              class="py-1 text-xs text-black/30 italic dark:text-white/30"
            >
              {{ t('MatchCard.buildsTab.noSkillUpgrades') }}
            </div>
          </div>
        </div>

        <!-- Items Section -->
        <div>
          <div class="mb-1.5 text-xs text-black/80 dark:text-white/50">
            {{ t('MatchCard.buildsTab.itemPurchases') }}
          </div>
          <div class="flex flex-wrap items-start gap-1">
            <div
              v-for="(item, idx) of collected.itemPurchaseEvents[p.participantId]?.filter(
                (x) => x.type === 'ITEM_PURCHASED' || x.type === 'LEAGUE_AKARI_ITEM_SPACER'
              )"
              :key="idx"
              class="flex flex-col items-center gap-0.5"
            >
              <template v-if="item.type === 'ITEM_PURCHASED'">
                <!-- Item icon -->
                <ItemDisplay :item-id="item.itemId" :size="28" />

                <!-- Timestamp -->
                <div class="text-[9px] whitespace-nowrap text-black/80 dark:text-white/50">
                  {{ formatMilliseconds(item.timestamp) }}
                </div>
              </template>

              <div
                v-else-if="item.type === 'LEAGUE_AKARI_ITEM_SPACER'"
                class="flex size-8 w-7 items-center justify-center text-black/50 dark:text-white/30"
              >
                →
              </div>
            </div>

            <!-- Empty state -->
            <div
              v-if="
                !collected.itemPurchaseEvents[p.participantId]?.filter(
                  (x) => x.type === 'ITEM_PURCHASED'
                ).length
              "
              class="py-1 text-xs text-black/30 italic dark:text-white/30"
            >
              {{ t('MatchCard.buildsTab.noItemPurchases') }}
            </div>
          </div>
        </div>
      </NCollapseTransition>
    </div>
  </NScrollbar>
  <div
    v-else
    class="flex h-142 w-full items-center justify-center text-sm text-black/60 dark:text-white/60"
  >
    <template v-if="loadingDetails">
      <div class="flex items-center gap-2">
        <NSpin :size="16" />
        <span>{{ t('MatchCard.common.loading') }}</span>
      </div>
    </template>
    <template v-else>
      <div class="flex items-center gap-2">
        <span>{{ t('MatchCard.common.noData') }}</span>
        <NButton type="primary" size="small" @click="loadDetails(basicInfo.gameId)">
          {{ t('MatchCard.common.refresh') }}
        </NButton>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import ItemDisplay from '@renderer-shared/components/widgets/ItemDisplay.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import {
  DetailedItemPurchasedEvent,
  DetailedSkillLevelUpEvent
} from '@shared/types/sgp/match-history'
import { ChevronRight20Regular } from '@vicons/fluent'
import { ArrowUp } from '@vicons/ionicons5'
import { useTranslation } from 'i18next-vue'
import { NButton, NCollapseTransition, NIcon, NScrollbar, NSpin } from 'naive-ui'
import { computed, ref, watch } from 'vue'

import { useMatchCard } from '../context'
import { usePosition } from '../utils/text'
import { getClassBySkillSlot, getTeamColor, useWinResultTagClasses } from '../utils/theme'
import { formatMilliseconds } from '../utils/time'

const {
  basicInfo,
  frames,
  participants,
  team,
  details,
  hidePrivacy,
  loadingDetails,
  loadDetails
} = useMatchCard()

const lcs = useLeagueClientStore()
const { t } = useTranslation()
const expandedParticipantIds = ref<number[]>([])

type LASpacerEvent = {
  type: 'LEAGUE_AKARI_ITEM_SPACER'
}

type ItemPurchaseEvent = DetailedItemPurchasedEvent | LASpacerEvent

const SKILL_SLOT_TRANSLATIONS = {
  1: 'Q',
  2: 'W',
  3: 'E',
  4: 'R'
}

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

const ANVIL_ITEM_IDS = [6032, 220000]

const collected = computed(() => {
  const flatten = frames.value.map((frame) => frame.events).flat()

  const skillLevelUpEvents: Record<
    number,
    (DetailedSkillLevelUpEvent & { displayLevel?: number })[]
  > = {}
  const itemPurchaseEvents: Record<number, ItemPurchaseEvent[]> = {}
  const anvils: Record<number, number> = {}

  const lastPurchaseTimestamp: Record<number, number> = {}

  for (const participant of participants.value) {
    lastPurchaseTimestamp[participant.participantId] = 0
  }

  for (const event of flatten) {
    switch (event.type) {
      case 'SKILL_LEVEL_UP':
        skillLevelUpEvents[event.participantId] = skillLevelUpEvents[event.participantId] ?? []
        skillLevelUpEvents[event.participantId].push(event)
        break

      case 'ITEM_PURCHASED':
        itemPurchaseEvents[event.participantId] = itemPurchaseEvents[event.participantId] ?? []

        // 超过 30s 给一个分割线
        if (
          lastPurchaseTimestamp[event.participantId] !== 0 &&
          event.timestamp - lastPurchaseTimestamp[event.participantId] > 30000
        ) {
          itemPurchaseEvents[event.participantId].push({
            type: 'LEAGUE_AKARI_ITEM_SPACER'
          })
        }

        lastPurchaseTimestamp[event.participantId] = event.timestamp
        itemPurchaseEvents[event.participantId].push(event)

        if (ANVIL_ITEM_IDS.includes(event.itemId)) {
          anvils[event.participantId] = (anvils[event.participantId] ?? 0) + 1
        }
        break
    }
  }

  for (const pid in skillLevelUpEvents) {
    let level = 0
    skillLevelUpEvents[pid] = skillLevelUpEvents[pid].map((evt) => {
      if (evt.levelUpType === 'EVOLVE') {
        return { ...evt }
      }
      level++
      return { ...evt, displayLevel: level }
    })
  }

  return {
    anvils,
    skillLevelUpEvents,
    itemPurchaseEvents
  }
})

const position = usePosition()
const tagTheme = useWinResultTagClasses(() => team.value?.winResult)

const isParticipantExpanded = (participantId: number) => {
  return expandedParticipantIds.value.includes(participantId)
}

const toggleParticipantExpanded = (participantId: number) => {
  if (isParticipantExpanded(participantId)) {
    expandedParticipantIds.value = expandedParticipantIds.value.filter((id) => id !== participantId)
    return
  }

  expandedParticipantIds.value = [...expandedParticipantIds.value, participantId]
}

watch(
  [details, loadingDetails, () => basicInfo.value.gameId],
  ([d, l, g]) => {
    if (!d && !l) {
      loadDetails(g)
    }
  },
  { immediate: true }
)

watch(
  () => basicInfo.value.gameId,
  () => {
    expandedParticipantIds.value = []
  },
  { immediate: true }
)
</script>
