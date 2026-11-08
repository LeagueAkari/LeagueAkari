<template>
  <section class="flex flex-col gap-3">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <span class="text-base font-bold text-black/85 dark:text-white/85">
        {{ t('selfImprovement.sections.matches') }}
      </span>
      <span class="text-[11px] text-black/40 dark:text-white/40">
        {{ t('selfImprovement.sections.matchesHint') }}
      </span>
    </div>

    <SelfImprovementRecentMatches :matches="visibleMatches" :show-header="false" />
  </section>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue'

import SelfImprovementRecentMatches from '../components/SelfImprovementRecentMatches.vue'
import { useSelfImprovementPageContext } from '../context'

const { t } = useTranslation()
const { visibleMatches } = useSelfImprovementPageContext()
</script>
