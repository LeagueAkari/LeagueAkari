<template>
  <NScrollbar class="h-full">
    <div class="@container box-border flex min-h-full flex-col gap-1.5 px-2 pb-2">
      <div
        class="flex min-h-14 items-center gap-2 rounded border border-black/10 bg-black/3 px-3 dark:border-white/10 dark:bg-white/5"
      >
        <ChampionIcon
          class="size-10 rounded-full border border-black/10 dark:border-white/10"
          :champion-id="currentChampionId"
        />
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-bold text-black/90 dark:text-white/90">
            {{ currentChampionName }}
          </div>
          <div class="text-xs text-black/55 dark:text-white/55">
            {{ t('opgg.champSelectAssistant.status') }}
          </div>
        </div>
        <NTag size="small" :bordered="false" type="info">
          {{ t('opgg.champSelectAssistant.active') }}
        </NTag>
      </div>

      <BenchChampionsMini />
      <AutomationPlan />

      <div class="grid grid-cols-1 gap-1.5 @min-[720px]:grid-cols-2">
        <ChampSelectActions />
        <div class="flex flex-col gap-1.5">
          <SkinSelectionMini />
          <ChampSelectOperations />
        </div>
      </div>
    </div>
  </NScrollbar>
</template>

<script setup lang="ts">
import {
  AutomationPlan,
  BenchChampionsMini,
  ChampSelectActions,
  ChampSelectOperations,
  SkinSelectionMini
} from '@renderer-shared/components/champ-select-assistant'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NScrollbar, NTag } from 'naive-ui'
import { computed } from 'vue'

const { t } = useTranslation()
const leagueClientStore = useLeagueClientStore()
const resources = useAkariResourceProvider()

const currentChampionId = computed(() => leagueClientStore.champSelect.currentChampion ?? -1)
const currentChampionName = computed(() => {
  if (currentChampionId.value <= 0) {
    return t('opgg.champSelectAssistant.waitingForChampion')
  }

  return resources.champions.name(currentChampionId.value)
})
</script>
