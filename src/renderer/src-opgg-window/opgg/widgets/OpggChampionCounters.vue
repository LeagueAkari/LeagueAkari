<template>
  <div
    class="mb-1 rounded border border-[#37373c] p-2 last:mb-0"
    v-if="champion && thatPosition && thatPosition.counters.length"
  >
    <!-- title line (title + expand) -->
    <div class="mb-2 flex items-center justify-between text-[13px] font-bold">
      {{ isCountersExpanded ? t('OpggChampion.allCounters') : t('OpggChampion.counter') }}
      <NSwitch
        size="small"
        v-model:value="isCountersExpanded"
        :round="false"
        class="mr-2"
        :rail-style="
          ({ checked }) => ({
            backgroundColor: checked ? '#2a947d' : '#d75a5a'
          })
        "
      >
        <template #checked>{{ t('OpggChampion.allC') }}</template>
        <template #unchecked>{{ t('OpggChampion.counterC') }}</template>
      </NSwitch>
    </div>

    <!-- expanded (注意展开和没有展开，用的数据不同。但一般来说既然后 thatPosition 数据，那么 champion.data.counters 数据也应该存在) -->
    <div class="counters flex flex-wrap gap-2" v-if="isCountersExpanded">
      <div
        class="counter flex w-[46px] cursor-pointer flex-col items-center transition-[filter] duration-200 hover:brightness-[1.2]"
        v-if="champion.data.counters"
        @click="setTab('champion', c.champion_id)"
        v-for="c of champion.data.counters?.toSorted(
          (a, b) => b.win / (b.play || 1) - a.win / (a.play || 1)
        )"
        :key="c.champion_id"
      >
        <LcuImage class="image mb-1 h-8 w-8" :src="championIconUri(c.champion_id)" />
        <div
          class="win-rate text-[11px] font-bold text-[#d75a5a]"
          :title="t('OpggChampion.winRate')"
          :class="{ 'text-[#a0c6f8]': c.win / (c.play || 1) > 0.5 }"
        >
          {{ ((c.win / (c.play || 1)) * 100).toFixed(2) }}%
        </div>
        <div class="play text-center text-[10px] text-[#a4a4a4]">
          {{
            t('OpggChampion.times', {
              times: c.play.toLocaleString()
            })
          }}
        </div>
      </div>

      <div
        class="flex h-16 w-full items-center justify-center text-sm text-white/50 dark:text-white/50"
        v-else
      >
        {{ t('OpggChampion.empty') }}
      </div>
    </div>

    <!-- not expanded -->
    <div class="counters flex flex-wrap gap-2" v-else>
      <div
        class="counter flex w-[46px] cursor-pointer flex-col items-center transition-[filter] duration-200 hover:brightness-[1.2]"
        v-if="thatPosition.counters"
        v-for="c of thatPosition.counters"
        :key="c.champion_id"
        @click="setTab('champion', c.champion_id)"
      >
        <LcuImage class="image mb-1 h-8 w-8" :src="championIconUri(c.champion_id)" />
        <div
          class="win-rate text-[11px] font-bold text-[#d75a5a]"
          :title="t('OpggChampion.winRate')"
        >
          {{ ((c.win / (c.play || 1)) * 100).toFixed(2) }}%
        </div>
        <div class="play text-center text-[10px] text-[#a4a4a4]">
          {{
            t('OpggChampion.times', {
              times: c.play.toLocaleString()
            })
          }}
        </div>
      </div>

      <!-- empty -->
      <div
        class="flex h-16 w-full items-center justify-center text-sm text-white/50 dark:text-white/50"
        v-else
      >
        {{ t('OpggChampion.empty') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { championIconUri } from '@renderer-shared/shards/league-client/utils'
import { useTranslation } from 'i18next-vue'
import { NSwitch } from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'

import { useOpgg } from '../context'

const { champion, position, setTab } = useOpgg()
const { t } = useTranslation()

const thatPosition = computed(() => {
  if (!champion.value) {
    return null
  }

  return champion.value.data.summary.positions?.find(
    (p) => p.name.toUpperCase() === position.value?.toUpperCase()
  )
})

const isCountersExpanded = ref(false)

watchEffect(() => {
  if (!champion.value) {
    isCountersExpanded.value = false
  }
})
</script>
