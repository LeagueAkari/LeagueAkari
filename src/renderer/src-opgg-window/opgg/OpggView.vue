<template>
  <div class="relative flex flex-col px-2 pt-1 pb-2">
    <OpggTabAndFilters class="mb-1" />

    <NEmpty
      v-if="isDataUnavailable"
      class="flex min-h-0 flex-1 items-center justify-center"
      :description="t('opgg.view.dataUnavailable')"
    />
    <template v-else>
      <KeepAlive>
        <MayhemOverview
          v-if="currentTab === 'champions' && mode === 'aram_mayhem'"
          class="min-h-0 flex-1"
        />
        <OpggChampionTable v-else-if="currentTab === 'champions'" class="min-h-0 flex-1" />
        <OpggChampion class="min-h-0 flex-1" v-else-if="currentTab === 'champion'" />
      </KeepAlive>
    </template>

    <SessionChampions />
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue'
import { NEmpty } from 'naive-ui'

import MayhemOverview from './MayhemOverview.vue'
import OpggChampion from './OpggChampion.vue'
import OpggChampionTable from './OpggChampionTable.vue'
import OpggTabAndFilters from './OpggTabAndFilters.vue'
import { useOpgg } from './context'
import SessionChampions from './widgets/SessionChampions.vue'

const { t } = useTranslation()
const { currentTab, mode, isDataUnavailable } = useOpgg()
</script>
