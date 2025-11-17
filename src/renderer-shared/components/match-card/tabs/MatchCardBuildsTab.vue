<template>
  <NScrollbar x-scrollable class="max-h-142">
    <!-- Players -->
    <div
      v-for="p of participants"
      :key="p.puuid"
      class="dark:bg-white/3 bg-black/3 rounded-lg p-3 not-last:mb-2"
    >
      <!-- Player Header -->
      <div class="flex items-center gap-2 mb-3">
        <ChampionIcon :champion-id="p.championId" class="!size-7 shrink-0" round />
        <div class="text-sm font-medium truncate min-w-0">
          {{ lcs.gameData.championName(p.championId) }}
        </div>
        <div v-if="p.position && p.position.toLowerCase() !== 'invalid'" :class="tagTheme">
          {{ position(p.position) }}
        </div>

        <!-- anvil -->
        <!-- <div
          class="text-xs text-black/50 py-0.5 px-1 dark:bg-white/10 dark:text-white text-black/50 text-xs bg-black/20 rounded"
        >
          34 锻
        </div> -->
      </div>

      <!-- Skills Section -->
      <div class="mb-3">
        <div class="text-xs dark:text-white/50 text-black/80 mb-1.5">技能构建</div>
        <div class="flex items-center gap-1 flex-wrap">
          <div
            v-for="(sk, idx) of collected.skillLevelUpEvents[p.participantId]"
            :key="idx"
            class="relative"
          >
            <div
              class="skill-slot size-6 flex items-center justify-center text-xs font-bold rounded cursor-default"
              :class="getSkillClass(sk.skillSlot)"
              :title="`${idx + 1} - ${SKILL_SLOT_TRANSLATIONS[sk.skillSlot as keyof typeof SKILL_SLOT_TRANSLATIONS]} - ${formatMilliseconds(sk.timestamp)}`"
            >
              {{
                SKILL_SLOT_TRANSLATIONS[sk.skillSlot as keyof typeof SKILL_SLOT_TRANSLATIONS] || 'U'
              }}
            </div>
            <div
              class="absolute z-1 -bottom-1 -right-1 text-[8px] leading-none py-0.5 bg-black/60 rounded text-white min-w-3 text-center"
            >
              {{ idx + 1 }}
            </div>
          </div>
        </div>
      </div>

      <!-- Items Section -->
      <div>
        <div class="text-xs dark:text-white/50 text-black/80 mb-1.5">装备购买</div>
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
              <div class="text-[9px] dark:text-white/50 text-black/80 whitespace-nowrap">
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
            无装备购买
          </div>
        </div>
      </div>
    </div>
  </NScrollbar>
</template>

<script lang="ts" setup>
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import ItemDisplay from '@renderer-shared/components/widgets/ItemDisplay.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import {
  DetailedItemPurchasedEvent,
  DetailedSkillLevelUpEvent
} from '@shared/types/sgp/match-history'
import { NScrollbar } from 'naive-ui'
import { computed } from 'vue'

import { useMatchCard } from '../context'
import { usePosition } from '../utils/text'
import { useWinResultTagTheme } from '../utils/theme'
import { formatMilliseconds } from '../utils/time'

const { frames, participants, team } = useMatchCard()

const lcs = useLeagueClientStore()

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

const collected = computed(() => {
  const flatten = frames.value.map((frame) => frame.events).flat()

  const skillLevelUpEvents: Record<number, DetailedSkillLevelUpEvent[]> = {}
  const itemPurchaseEvents: Record<number, ItemPurchaseEvent[]> = {}

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
        break
    }
  }

  return {
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
</script>

<style scoped>
@import '../match-card.css';
</style>
