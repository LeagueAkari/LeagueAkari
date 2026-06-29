<template>
  <div
    class="mb-1 rounded border border-black/10 p-2 last:mb-0 dark:border-[#37373c]"
    v-if="augments && Object.keys(augments).length"
  >
    <NTabs v-model:value="augmentTab" size="small" :animated="false">
      <template #suffix>
        <NCheckbox size="small" v-model:checked="isAugmentsExpanded">
          {{ t('opgg.champion.showAll') }}
        </NCheckbox>
      </template>

      <!-- silver -->
      <NTabPane name="silver" v-if="augments && augments[1]">
        <template #tab>
          <span class="text-xs font-bold">{{ t('opgg.champion.augmentSilver') }}</span>
        </template>
        <div
          class="mb-1 flex items-center gap-1 last:mb-0"
          v-for="(a, i) of augments[1].augments.slice(0, isAugmentsExpanded ? Infinity : 4)"
        >
          <div class="min-w-6 text-[10px] text-[#666666] dark:text-[#b2b2b2]">#{{ i + 1 }}</div>
          <div class="flex items-center gap-1">
            <AugmentDisplay :size="24" :augment-id="a.id" class="mr-1" />
            <span class="name text-xs">{{ lcs.gameData.augmentName(a.id) }}</span>
          </div>
          <div class="desc ml-auto flex items-center">
            <div class="pick flex min-w-19 flex-col items-center">
              <span
                class="pick-rate text-xs font-bold text-[#1a1a1a] dark:text-[#ebebeb]"
                :title="t('opgg.champion.pickRate')"
                >{{ (a.pick_rate * 100).toFixed(2) }}%</span
              >
              <span
                class="pick-play text-center text-xs text-[#666666] dark:text-[#bebebe]"
                :title="t('opgg.champion.plays')"
              >
                {{
                  t('opgg.champion.times', {
                    times: a.play.toLocaleString()
                  })
                }}</span
              >
            </div>
            <div
              class="win-rate min-w-19 text-center text-xs font-bold text-[#2563eb] dark:text-[#a0c6f8]"
              :title="t('opgg.champion.winRate')"
            >
              {{ ((a.win / (a.play || 1)) * 100).toFixed(2) }}%
            </div>
          </div>
        </div>
      </NTabPane>

      <!-- gold -->
      <NTabPane name="gold" v-if="augments && augments[4]">
        <template #tab>
          <span class="text-xs font-bold">{{ t('opgg.champion.augmentGold') }}</span>
        </template>
        <div
          class="mb-1 flex items-center gap-1 last:mb-0"
          v-for="(a, i) of augments[4].augments.slice(0, isAugmentsExpanded ? Infinity : 4)"
        >
          <div class="min-w-6 text-[10px] text-[#666666] dark:text-[#b2b2b2]">#{{ i + 1 }}</div>
          <div class="flex items-center gap-1">
            <AugmentDisplay :size="24" :augment-id="a.id" class="mr-1" />
            <span class="name text-xs">{{ lcs.gameData.augmentName(a.id) }}</span>
          </div>
          <div class="desc ml-auto flex items-center">
            <div class="pick flex min-w-19 flex-col items-center">
              <span
                class="pick-rate text-xs font-bold text-[#1a1a1a] dark:text-[#ebebeb]"
                :title="t('opgg.champion.pickRate')"
                >{{ (a.pick_rate * 100).toFixed(2) }}%</span
              >
              <span
                class="pick-play text-center text-xs text-[#666666] dark:text-[#bebebe]"
                :title="t('opgg.champion.plays')"
              >
                {{
                  t('opgg.champion.times', {
                    times: a.play.toLocaleString()
                  })
                }}</span
              >
            </div>
            <div
              class="win-rate min-w-19 text-center text-xs font-bold text-[#2563eb] dark:text-[#a0c6f8]"
              :title="t('opgg.champion.winRate')"
            >
              {{ ((a.win / (a.play || 1)) * 100).toFixed(2) }}%
            </div>
          </div>
        </div>
      </NTabPane>

      <!-- prism tab -->
      <NTabPane name="prism" v-if="augments && augments[8]">
        <template #tab>
          <span class="text-xs font-bold">{{ t('opgg.champion.augmentPrism') }}</span>
        </template>

        <div
          class="mb-1 flex items-center gap-1 last:mb-0"
          v-for="(a, i) of augments[8].augments.slice(0, isAugmentsExpanded ? Infinity : 4)"
        >
          <div class="min-w-6 text-[10px] text-[#666666] dark:text-[#b2b2b2]">#{{ i + 1 }}</div>
          <div class="flex items-center gap-1">
            <AugmentDisplay :size="24" :augment-id="a.id" class="mr-1" />
            <span class="name text-xs">{{ lcs.gameData.augmentName(a.id) }}</span>
          </div>
          <div class="desc ml-auto flex items-center">
            <div class="pick flex min-w-19 flex-col items-center">
              <span
                class="pick-rate text-xs font-bold text-[#1a1a1a] dark:text-[#ebebeb]"
                :title="t('opgg.champion.pickRate')"
                >{{ (a.pick_rate * 100).toFixed(2) }}%</span
              >
              <span
                class="pick-play text-center text-xs text-[#666666] dark:text-[#bebebe]"
                :title="t('opgg.champion.plays')"
              >
                {{
                  t('opgg.champion.times', {
                    times: a.play.toLocaleString()
                  })
                }}</span
              >
            </div>
            <div
              class="win-rate min-w-19 text-center text-xs font-bold text-[#2563eb] dark:text-[#a0c6f8]"
              :title="t('opgg.champion.winRate')"
            >
              {{ ((a.win / (a.play || 1)) * 100).toFixed(2) }}%
            </div>
          </div>
        </div>
      </NTabPane>
    </NTabs>
  </div>
</template>

<script setup lang="ts">
import AugmentDisplay from '@renderer-shared/components/widgets/AugmentDisplay.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { OpggArenaAugmentGroup } from '@shared/types/opgg'
import { useTranslation } from 'i18next-vue'
import { NCheckbox, NTabPane, NTabs } from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'

import { useOpgg } from '../context'

const { champion } = useOpgg()
const { t } = useTranslation()
const lcs = useLeagueClientStore()

const augmentTab = ref<string | undefined>('silver')
// OP.GG 使用 rarity 来表示三种不同的 augment 等级
// 1 - silver, 4 - gold, 8 - prism
const augments = computed(() => {
  if (!champion.value || !champion.value.data.augment_group) {
    return null
  }

  return champion.value.data.augment_group.reduce(
    (acc, cur) => {
      acc[cur.rarity] = cur
      return acc
    },
    {} as Record<number, OpggArenaAugmentGroup>
  )
})

watchEffect(() => {
  if (!augments.value) {
    augmentTab.value = undefined
    return
  }

  if (augments.value[1]) {
    augmentTab.value = 'silver'
  } else if (augments.value[4]) {
    augmentTab.value = 'gold'
  } else if (augments.value[8]) {
    augmentTab.value = 'prism'
  } else {
    augmentTab.value = undefined
  }
})

const isAugmentsExpanded = ref(false)

watchEffect(() => {
  if (!champion.value) {
    isAugmentsExpanded.value = false
  }
})
</script>
