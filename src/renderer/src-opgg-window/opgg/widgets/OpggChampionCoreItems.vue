<template>
  <div
    class="mb-1 rounded border border-black/10 p-2 last:mb-0 dark:border-[#37373c]"
    v-if="champion && champion.data.core_items && champion.data.core_items.length"
  >
    <div class="mb-2 flex items-center justify-between text-[13px] font-bold">
      {{ t('OpggChampion.coreItemText')
      }}<NCheckbox
        v-if="champion.data.core_items.length > 4"
        size="small"
        v-model:checked="isCoreItemsExpanded"
        >{{ t('OpggChampion.showAll') }}</NCheckbox
      >
    </div>
    <div class="card-content">
      <div
        class="mb-1 flex items-center gap-1 last:mb-0"
        v-for="(s, i) of champion.data.core_items.slice(0, isCoreItemsExpanded ? Infinity : 4)"
      >
        <div class="min-w-4 text-[10px] text-[#666666] dark:text-[#b2b2b2]">#{{ i + 1 }}</div>
        <template v-for="(ss, i) of s.ids">
          <ItemDisplay :size="24" :item-id="ss" :max-width="300" />
          <NIcon
            v-if="i < s.ids.length - 1"
            class="separator text-[10px] text-[#999999] dark:text-[#909090]"
          >
            <ArrowForwardIosOutlinedIcon />
          </NIcon>
        </template>
        <div class="desc ml-auto flex items-center">
          <div class="pick flex min-w-19 flex-col items-center">
            <span
              class="pick-rate text-xs font-bold text-[#1a1a1a] dark:text-[#ebebeb]"
              :title="t('OpggChampion.pickRate')"
              >{{ (s.pick_rate * 100).toFixed(2) }}%</span
            >
            <span
              class="pick-play text-center text-xs text-[#666666] dark:text-[#bebebe]"
              :title="t('OpggChampion.plays')"
              >{{
                t('OpggChampion.times', {
                  times: s.play.toLocaleString()
                })
              }}</span
            >
          </div>
          <div
            class="win-rate min-w-19 text-center text-xs font-bold text-[#2563eb] dark:text-[#a0c6f8]"
            :title="t('OpggChampion.winRate')"
          >
            {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ItemDisplay from '@renderer-shared/components/widgets/ItemDisplay.vue'
import { ArrowForwardIosOutlined as ArrowForwardIosOutlinedIcon } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NCheckbox, NIcon } from 'naive-ui'
import { ref, watchEffect } from 'vue'

import { useOpgg } from '../context'

const { champion } = useOpgg()
const { t } = useTranslation()

const isCoreItemsExpanded = ref(false)

watchEffect(() => {
  if (!champion.value) {
    isCoreItemsExpanded.value = false
  }
})
</script>
