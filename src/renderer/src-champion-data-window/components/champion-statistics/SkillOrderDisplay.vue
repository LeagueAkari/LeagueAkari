<template>
  <RecommendationRow :rank="rank" layout="skills">
    <RecommendationSequence :items="priority" ordered>
      <template #default="{ item: s }">
        <div
          class="skill relative box-border flex h-6 min-w-6 items-center justify-center rounded-sm px-0.5"
          :class="skillColors[s[0]]"
        >
          {{ s }}
        </div>
      </template>
    </RecommendationSequence>

    <template #metrics><slot name="metrics" /></template>

    <template v-if="order.length" #details>
      <div class="max-w-full overflow-x-auto">
        <div role="table" class="grid w-max gap-0.5" :style="gridStyle">
          <div role="row" class="contents">
            <span role="columnheader" class="skill-cell" />
            <span
              v-for="(_, index) in order"
              :key="index"
              role="columnheader"
              class="skill-cell text-black/50 dark:text-white/50"
            >
              {{ index + 1 }}
            </span>
          </div>
          <div v-for="ability in abilities" :key="ability" role="row" class="contents">
            <span
              role="rowheader"
              class="skill-cell font-semibold text-black/60 dark:text-white/60"
            >
              {{ ability }}
            </span>
            <template v-for="(code, index) in order" :key="index">
              <NTooltip v-if="ability === 'R' && code.startsWith('R-')">
                <template #trigger>
                  <span role="cell" class="skill-cell relative cursor-help" :class="skillColors.R">
                    {{ code.slice(2) }}
                    <span class="absolute top-px right-px text-[9px] leading-none">↑</span>
                  </span>
                </template>
                {{ t('opgg.champion.skillEvolution', { level: index + 1, skill: code.slice(2) }) }}
              </NTooltip>
              <span
                v-else
                role="cell"
                class="skill-cell"
                :class="code === ability ? skillColors[ability] : 'bg-black/5 dark:bg-black/20'"
              >
                {{ code === ability ? ability : '' }}
              </span>
            </template>
          </div>
        </div>
      </div>
    </template>
  </RecommendationRow>
</template>
<script setup lang="ts">
import { useTranslation } from 'i18next-vue'
import { NTooltip } from 'naive-ui'
import { computed } from 'vue'

import RecommendationRow from './RecommendationRow.vue'
import RecommendationSequence from './RecommendationSequence.vue'

const { rank, priority, order } = defineProps<{
  rank: number | null
  priority: string[]
  order: string[]
}>()
const { t } = useTranslation()

const abilities = ['Q', 'W', 'E', 'R'] as const
const skillColors: Record<string, string> = {
  Q: 'bg-gray-200 text-[#0178c4] dark:bg-[#3f3f46] dark:text-[#01a8fb]',
  W: 'bg-gray-200 text-[#00a085] dark:bg-[#3f3f46] dark:text-[#00d7b0]',
  E: 'bg-gray-200 text-[#cc6600] dark:bg-[#3f3f46] dark:text-[#ff8200]',
  R: 'bg-[#5f32e6] text-white'
}

const gridStyle = computed(() => ({
  gridTemplateColumns: `32px repeat(${order.length}, 22px)`
}))
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

.skill-cell {
  @apply box-border flex size-5.5 items-center justify-center rounded-xs text-[11px];
}
</style>
