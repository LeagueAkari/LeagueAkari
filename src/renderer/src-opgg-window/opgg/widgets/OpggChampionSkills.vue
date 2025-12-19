<template>
  <div
    class="mb-1 rounded border border-black/10 p-2 last:mb-0 dark:border-[#37373c]"
    v-if="champion && champion.data.skill_masteries && champion.data.skill_masteries.length"
  >
    <div class="mb-2 flex items-center justify-between text-[13px] font-bold">
      {{ t('OpggChampion.abilityBuild')
      }}<NCheckbox
        v-if="champion.data.skill_masteries.length > 2"
        size="small"
        v-model:checked="isSkillMasteriesExpanded"
      >
        {{ t('OpggChampion.showAll') }}
      </NCheckbox>
    </div>
    <div class="card-content">
      <div
        class="mb-2 flex min-h-[56px] items-center last:mb-0"
        v-for="(m, i) of champion.data.skill_masteries.slice(
          0,
          isSkillMasteriesExpanded ? Infinity : 2
        )"
      >
        <div class="mr-1 min-w-[16px] text-[10px] text-[#666666] dark:text-[#b2b2b2]">#{{ i + 1 }}</div>
        <div>
          <div class="mb-2 flex flex-wrap items-center gap-1">
            <template v-for="(s, i) of m.ids">
              <div
                class="skill relative box-border flex h-6 min-w-6 items-center justify-center rounded-[4px] px-[2px]"
                :class="{
                  'bg-gray-200 text-[#00a085] dark:bg-[#3f3f46] dark:text-[#00d7b0]': s.startsWith('W'),
                  'bg-gray-200 text-[#0178c4] dark:bg-[#3f3f46] dark:text-[#01a8fb]': s.startsWith('Q'),
                  'bg-gray-200 text-[#cc6600] dark:bg-[#3f3f46] dark:text-[#ff8200]': s.startsWith('E'),
                  'bg-[#5f32e6] text-white': s.startsWith('R')
                }"
              >
                {{ s }}
              </div>
              <NIcon v-if="i < m.ids.length - 1" class="separator text-[10px] text-[#999999] dark:text-[#909090]">
                <ArrowForwardIosOutlinedIcon />
              </NIcon>
            </template>
          </div>
          <div class="flex flex-wrap gap-[2px]">
            <!-- display only one group of it -->
            <div
              class="skill relative box-border flex h-4 min-w-[16px] items-center justify-center rounded-[2px] px-[2px] text-[10px]"
              :class="{
                'bg-gray-200 text-[#00a085] dark:bg-[#3f3f46] dark:text-[#00d7b0]': s.startsWith('W'),
                'bg-gray-200 text-[#0178c4] dark:bg-[#3f3f46] dark:text-[#01a8fb]': s.startsWith('Q'),
                'bg-gray-200 text-[#cc6600] dark:bg-[#3f3f46] dark:text-[#ff8200]': s.startsWith('E'),
                'bg-[#5f32e6] text-white': s.startsWith('R')
              }"
              v-for="s of m.builds[0].order"
            >
              {{ s }}
            </div>
          </div>
        </div>
        <div class="desc ml-auto flex items-center">
          <div class="pick flex min-w-[76px] flex-col items-center">
            <span
              class="pick-rate text-xs font-bold text-[#1a1a1a] dark:text-[#ebebeb]"
              :title="t('OpggChampion.pickRate')"
              >{{ (m.pick_rate * 100).toFixed(2) }}%</span
            >
            <span
              class="pick-play text-center text-xs text-[#666666] dark:text-[#bebebe]"
              :title="t('OpggChampion.plays')"
            >
              {{
                t('OpggChampion.times', {
                  times: m.play.toLocaleString()
                })
              }}</span
            >
          </div>
          <div
            class="win-rate min-w-[76px] text-center text-xs font-bold text-[#2563eb] dark:text-[#a0c6f8]"
            :title="t('OpggChampion.winRate')"
          >
            {{ ((m.win / (m.play || 1)) * 100).toFixed(2) }}%
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowForwardIosOutlined as ArrowForwardIosOutlinedIcon } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NCheckbox, NIcon } from 'naive-ui'
import { ref, watchEffect } from 'vue'

import { useOpgg } from '../context'

const { champion } = useOpgg()
const { t } = useTranslation()

const isSkillMasteriesExpanded = ref(false)

watchEffect(() => {
  if (!champion.value) {
    isSkillMasteriesExpanded.value = false
  }
})
</script>
