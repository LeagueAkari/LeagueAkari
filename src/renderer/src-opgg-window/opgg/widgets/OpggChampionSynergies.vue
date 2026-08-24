<template>
  <div
    class="mb-1 rounded border border-black/10 p-2 last:mb-0 dark:border-[#37373c]"
    v-if="champion && champion.data.synergies && champion.data.synergies.length"
  >
    <div class="mb-2 flex items-center justify-between text-[13px] font-bold">
      {{ t('opgg.champion.synergies')
      }}<NCheckbox size="small" v-model:checked="isSynergiesExpanded">{{
        t('opgg.champion.showAll')
      }}</NCheckbox>
    </div>
    <div
      class="mb-1 flex items-center gap-1 last:mb-0"
      v-for="(s, i) of champion.data.synergies.slice(0, isSynergiesExpanded ? Infinity : 4)"
    >
      <div class="mr-1 min-w-4 text-[10px] text-[#666666] dark:text-[#b2b2b2]">#{{ i + 1 }}</div>
      <div
        class="flex cursor-pointer items-center gap-1 text-xs transition-[filter] duration-200 hover:brightness-120"
        @click="setTab('champion', s.champion_id)"
      >
        <LcuImage
          class="image size-6"
          :src="resources.champions.icon(s.champion_id)?.iconPath ?? ''"
        />
        <span>{{ resources.champions.name(s.champion_id) }}</span>
      </div>
      <div class="desc ml-auto flex items-center">
        <div
          v-if="s.play > 0 && typeof s.total_place === 'number'"
          class="value-text flex min-w-19 flex-col items-center"
        >
          <span class="value text-xs font-bold text-[#1a1a1a] dark:text-[#ebebeb]">{{
            (s.total_place / s.play).toFixed(2)
          }}</span>
          <span class="text text-xs text-[#666666] dark:text-[#bebebe]"
            >{{ t('opgg.champion.avgPlace') }}
          </span>
        </div>
        <div
          v-if="s.play > 0 && typeof s.first_place === 'number'"
          class="value-text flex min-w-19 flex-col items-center"
        >
          <span class="value text-xs font-bold text-[#1a1a1a] dark:text-[#ebebeb]"
            >{{ ((s.first_place / s.play) * 100).toFixed(2) }}%</span
          >
          <span class="text text-xs text-[#666666] dark:text-[#bebebe]">{{
            t('opgg.champion.1st')
          }}</span>
        </div>
        <div class="value-text flex min-w-19 flex-col items-center">
          <span
            class="value text-xs font-bold text-[#1a1a1a] dark:text-[#ebebeb]"
            :title="t('opgg.champion.pickRate')"
            >{{
              typeof s.pick_rate === 'number' ? `${(s.pick_rate * 100).toFixed(2)}%` : '-'
            }}</span
          >
          <span
            class="text text-xs text-[#666666] dark:text-[#bebebe]"
            :title="t('opgg.champion.plays')"
            >{{
              s.play > 0
                ? t('opgg.champion.times', { times: s.play.toLocaleString() })
                : t('opgg.champion.pickRate')
            }}</span
          >
        </div>
        <div class="value-text flex min-w-19 flex-col items-center">
          <span
            class="value text-xs font-bold text-[#1a1a1a] dark:text-[#ebebeb]"
            :title="t('opgg.champion.winRate')"
            >{{
              typeof s.win === 'number' ? `${((s.win / (s.play || 1)) * 100).toFixed(2)}%` : '-'
            }}</span
          >
          <span
            class="text text-xs text-[#666666] dark:text-[#bebebe]"
            :title="t('opgg.champion.winRate')"
            >{{ t('opgg.champion.winRate') }}</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { useTranslation } from 'i18next-vue'
import { NCheckbox } from 'naive-ui'
import { ref, watchEffect } from 'vue'

import { useOpgg } from '../context'

const { champion, setTab } = useOpgg()
const { t } = useTranslation()
const resources = useAkariResourceProvider()

const isSynergiesExpanded = ref(false)

watchEffect(() => {
  if (!champion.value) {
    isSynergiesExpanded.value = false
  }
})
</script>
