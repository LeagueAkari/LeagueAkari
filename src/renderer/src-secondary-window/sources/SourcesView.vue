<template>
  <div class="flex min-h-0 flex-col">
    <div
      v-if="!activeSource"
      role="status"
      class="flex min-h-0 flex-1 items-center justify-center px-6 text-center"
    >
      <div class="flex w-full max-w-80 flex-col items-center">
        <div
          class="mb-5 flex size-16 items-center justify-center rounded-2xl bg-black/4 text-black/35 dark:bg-white/5 dark:text-white/35"
        >
          <NIcon :size="32"><ChartLineData /></NIcon>
        </div>
        <div class="text-lg leading-7 font-semibold text-black/80 dark:text-white/85">
          {{ t('opgg.sources.emptyTitle') }}
        </div>
        <div class="mt-2 text-xs leading-5 text-black/50 dark:text-white/50">
          {{ emptyDescription }}
        </div>
      </div>
    </div>
    <KeepAlive>
      <Qq101Tabs v-if="activeSource === 'qq101'" class="h-0 min-h-0 flex-1" />
      <OpggTabs v-else-if="activeSource === 'opgg'" class="h-0 min-h-0 flex-1" />
    </KeepAlive>
  </div>
</template>

<script setup lang="ts">
import type { ChampionDataSourceId } from '@shared/types/champion-data'
import { ChartLineData } from '@vicons/carbon'
import { useTranslation } from 'i18next-vue'
import { NIcon } from 'naive-ui'
import { computed } from 'vue'

import OpggTabs from '../opgg/OpggTabs.vue'
import Qq101Tabs from '../qq101/Qq101Tabs.vue'

const props = defineProps<{
  activeSource: ChampionDataSourceId | null
  hasVisibleSource: boolean
}>()

const { t } = useTranslation()
const emptyDescription = computed(() =>
  t(
    props.hasVisibleSource
      ? 'opgg.sources.disabledDescription'
      : 'opgg.sources.unavailableDescription'
  )
)
</script>
