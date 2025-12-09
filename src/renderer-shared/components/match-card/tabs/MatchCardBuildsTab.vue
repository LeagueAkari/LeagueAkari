<template>
  <NScrollbar x-scrollable class="max-h-142" v-if="details">
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
        <div class="text-sm font-medium truncate min-w-0 text-black dark:text-white">
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
          class="text-xs text-black/50 py-0.5 px-1 dark:bg-white/10 dark:text-white text-black/50 text-xs bg-black/20 rounded"
        >
          {{ t('MatchCard.buildsTab.anvils', { count: collected.anvils[p.participantId] }) }}
        </div>
      </div>

      <!-- Skills Section -->
      <div class="mb-3">
        <div class="text-xs dark:text-white/50 text-black/80 mb-1.5">
          {{ t('MatchCard.buildsTab.skillBuild') }}
        </div>
        <div class="flex items-center gap-1 flex-wrap">
          <div
            v-for="(sk, idx) of collected.skillLevelUpEvents[p.participantId]"
            :key="idx"
            class="relative"
          >
            <div
              v-if="sk.levelUpType === 'EVOLVE'"
              class="size-6 flex items-center justify-center text-xs font-bold rounded cursor-default relative bg-rose-500/60 b-rose-500 dark:bg-rose-400/60 dark:b-rose-400/60 b b-solid rounded-full"
              :title="`${sk.displayLevel ? sk.displayLevel + ' - ' : ''}${SKILL_SLOT_TRANSLATIONS[sk.skillSlot as keyof typeof SKILL_SLOT_TRANSLATIONS]} (Evolved) - ${formatMilliseconds(sk.timestamp)}`"
            >
              {{
                SKILL_SLOT_TRANSLATIONS[sk.skillSlot as keyof typeof SKILL_SLOT_TRANSLATIONS] || 'U'
              }}
              <div
                class="absolute -top-1 -right-1 size-3 bg-amber-400 dark:bg-amber-500 text-black rounded-full flex items-center justify-center shadow-sm b b-solid b-white dark:b-neutral-900"
              >
                <NIcon size="10"><ArrowUp /></NIcon>
              </div>
            </div>
            <div
              v-else
              class="size-6 flex items-center justify-center text-xs font-bold rounded cursor-default"
              :class="getSkillClass(sk.skillSlot)"
              :title="`${sk.displayLevel} - ${SKILL_SLOT_TRANSLATIONS[sk.skillSlot as keyof typeof SKILL_SLOT_TRANSLATIONS]} - ${formatMilliseconds(sk.timestamp)}`"
            >
              {{
                SKILL_SLOT_TRANSLATIONS[sk.skillSlot as keyof typeof SKILL_SLOT_TRANSLATIONS] || 'U'
              }}
            </div>

            <div
              v-if="sk.displayLevel"
              class="absolute z-1 -bottom-1 -right-1 text-8px leading-none py-0.5 bg-black/60 rounded text-white min-w-3 text-center"
            >
              {{ sk.displayLevel }}
            </div>
          </div>

          <!-- Empty state -->
          <div
            v-if="!collected.skillLevelUpEvents[p.participantId]?.length"
            class="text-xs dark:text-white/30 text-black/30 italic py-1"
          >
            {{ t('MatchCard.buildsTab.noSkillUpgrades') }}
          </div>
        </div>
      </div>

      <!-- Items Section -->
      <div>
        <div class="text-xs dark:text-white/50 text-black/80 mb-1.5">
          {{ t('MatchCard.buildsTab.itemPurchases') }}
        </div>
        <div class="flex items-start gap-1 flex-wrap">
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
              <div class="text-9px dark:text-white/50 text-black/80 whitespace-nowrap">
                {{ formatMilliseconds(item.timestamp) }}
              </div>
            </template>

            <div
              v-else-if="item.type === 'LEAGUE_AKARI_ITEM_SPACER'"
              class="w-7 dark:text-white/30 text-black/50 flex items-center justify-center size-8"
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
            class="text-xs dark:text-white/30 text-black/30 italic py-1"
          >
            {{ t('MatchCard.buildsTab.noItemPurchases') }}
          </div>
        </div>
      </div>
    </div>
  </NScrollbar>
  <div
    v-else
    class="h-142 w-full flex items-center justify-center dark:text-white/60 text-black/60 text-sm"
  >
    <template v-if="loadingDetails">
      <div class="flex gap-2 items-center">
        <NSpin :size="16" />
        <span>{{ t('MatchCard.common.loading') }}</span>
      </div>
    </template>
    <template v-else>
      <div class="flex gap-2 items-center">
        <span>{{ t('MatchCard.common.noData') }}</span>
        <NButton type="primary" size="small" @click="onLoadDetails(basicInfo.gameId)">
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
import { ArrowUp } from '@vicons/ionicons5'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NScrollbar, NSpin } from 'naive-ui'
import { computed } from 'vue'

import { useMatchCard } from '../context'
import { usePosition } from '../utils/text'
import { getTeamColor } from '../utils/theme'
import { useWinResultTagTheme } from '../utils/theme'
import { formatMilliseconds } from '../utils/time'

const {
  basicInfo,
  frames,
  participants,
  team,
  details,
  hidePrivacy,
  loadingDetails,
  onLoadDetails
} = useMatchCard()

const lcs = useLeagueClientStore()
const { t } = useTranslation()

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

// 根据技能槽位返回对应的样式类
const getSkillClass = (skillSlot: number) => {
  const classes = {
    1: 'bg-sky-500/40 b-sky-500 dark:bg-sky-600/20 dark:b-sky-400/60 b b-solid',
    2: 'bg-emerald-500/40 b-emerald-500 dark:bg-emerald-400/20 dark:b-emerald-400/60 b b-solid',
    3: 'bg-violet-500/40 b-violet-500 dark:bg-violet-400/20 dark:b-violet-400/60 b b-solid',
    4: 'bg-orange-500/40 b-orange-500 dark:bg-orange-400/20 dark:b-orange-400/60 b b-solid'
  }
  return classes[skillSlot as keyof typeof classes] || 'bg-gray-300/20 b-gray-300/50 b b-solid'
}

const position = usePosition()
const tagTheme = useWinResultTagTheme(() => team.value?.winResult)

if (!details.value && !loadingDetails.value) {
  onLoadDetails(basicInfo.value.gameId)
}
</script>
