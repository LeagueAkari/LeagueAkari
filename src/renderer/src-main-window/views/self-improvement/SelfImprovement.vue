<template>
  <div class="flex h-full flex-col">
    <div class="flex shrink-0 items-end border-b border-black/10 px-6 dark:border-white/10">
      <div class="mr-6 mb-1 flex items-center gap-2 text-black/80 dark:text-white/80">
        <NIcon class="text-2xl" :component="ChartIcon" />
        <span class="text-base font-bold">{{ t('selfImprovement.page.title') }}</span>
      </div>
    </div>

    <SelfImprovementToolbar />

    <div class="relative h-0 flex-1">
      <SelfImprovementStateView class="h-full">
        <NScrollbar class="h-full">
          <div class="mx-auto flex max-w-[1100px] flex-col gap-6 p-6">
            <OverviewSection />
            <DetailedDataSection />
            <MatchesSection />
          </div>
        </NScrollbar>
      </SelfImprovementStateView>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChartLineData as ChartIcon } from '@vicons/carbon'
import { useTranslation } from 'i18next-vue'
import { NIcon, NScrollbar } from 'naive-ui'
import { provide } from 'vue'

import SelfImprovementStateView from './components/SelfImprovementStateView.vue'
import SelfImprovementToolbar from './components/SelfImprovementToolbar.vue'
import { useSelfImprovementPage } from './composables/useSelfImprovementPage'
import { SELF_IMPROVEMENT_PAGE_CONTEXT_KEY } from './context'
import DetailedDataSection from './sections/DetailedDataSection.vue'
import MatchesSection from './sections/MatchesSection.vue'
import OverviewSection from './sections/OverviewSection.vue'

const { t } = useTranslation()

const context = useSelfImprovementPage()
provide(SELF_IMPROVEMENT_PAGE_CONTEXT_KEY, context)
</script>
