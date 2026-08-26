<template>
  <div class="flex h-full min-h-(--la-app-min-height) min-w-(--la-app-min-width) flex-col">
    <SetupInAppScope />
    <OpggWindowTitlebar />

    <NTabs
      v-if="isChampSelectAvailable"
      v-model:value="activeWorkspace"
      class="px-2 pb-1"
      type="segment"
      size="small"
    >
      <NTab name="data" :tab="t('opgg.workspace.data')" />
      <NTab name="champ-select" :tab="t('opgg.workspace.champSelect')" />
    </NTabs>

    <KeepAlive>
      <ChampSelectAssistant
        v-if="activeWorkspace === 'champ-select' && isChampSelectAvailable"
        class="h-0 flex-1"
      />
      <OpggView v-else class="h-0 flex-1" />
    </KeepAlive>
  </div>
</template>

<script setup lang="ts">
import { SetupInAppScope } from '@renderer-shared/shards/setup-in-app-scope/setup-in-app-scope-component'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NTab, NTabs } from 'naive-ui'
import { computed, ref, watch } from 'vue'

import ChampSelectAssistant from './champ-select-assistant/ChampSelectAssistant.vue'
import OpggView from './opgg/OpggView.vue'
import OpggWindowTitlebar from './opgg/OpggWindowTitlebar.vue'
import { provideOpgg } from './opgg/context'

provideOpgg()

const { t } = useTranslation()
const leagueClientStore = useLeagueClientStore()

type Workspace = 'data' | 'champ-select'
const activeWorkspace = ref<Workspace>('data')
const isChampSelectAvailable = computed(
  () =>
    leagueClientStore.gameflow.phase === 'ChampSelect' &&
    !leagueClientStore.champSelect.session?.isSpectating
)

watch(
  isChampSelectAvailable,
  (available) => {
    activeWorkspace.value = available ? 'champ-select' : 'data'
  },
  { immediate: true }
)
</script>
