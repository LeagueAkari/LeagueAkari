<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <Qq101TabBar
      :pages="state.pages.items"
      v-model:active-id="activeId"
      v-model:order="tabOrder"
      :loading="state.isLoading"
      @close="controller.pages.close($event)"
      @refresh="refreshPage"
    />
    <NEmpty
      v-if="managedPage && !managedPage.view"
      class="flex min-h-0 flex-1 items-center justify-center"
      :description="
        t(
          managedPage.currentGame?.unavailableReason
            ? `opgg.automation.status.${managedPage.currentGame.unavailableReason}`
            : managedPage.modeChange.status === 'error'
              ? 'opgg.automation.status.loadError'
              : 'opgg.automation.status.loading'
        )
      "
    />
    <Qq101RankingsTab
      v-show="state.pages.activeId === 'rankings'"
      :preferences="preferences"
      :loaded-preferences="state.loadedPreferences"
      :overview="state.overview"
      :patches="state.patches"
      :loading="state.isLoading"
      :error="state.error"
      :classic-lanes="state.classicLanes"
      @change="controller.changePreferences($event)"
      @refresh="refreshPage('rankings')"
      @champion="(id, position) => controller.selectChampion(id, position)"
      @pairs="controller.queryPairs($event)"
    />
    <Qq101Page
      v-for="page in contentPages"
      :key="page.id"
      :page-id="page.id"
      v-show="state.pages.activeId === page.id"
    />
  </div>
</template>
<script setup lang="ts">
import { NEmpty } from 'naive-ui'
import { useTranslation } from 'i18next-vue'

import { useInstance } from '@renderer-shared/shards'
import { ChampionDataRenderer } from '@champion-data-window/shards/champion-data'
import { useChampionDataStore } from '@champion-data-window/shards/champion-data/store'
import type { Qq101Page as Qq101PageState } from '@champion-data-window/shards/champion-data/qq101/types'
import { computed } from 'vue'
import Qq101RankingsTab from './rankings-tab/Qq101RankingsTab.vue'
import Qq101Page from './Qq101Page.vue'
import Qq101TabBar from './Qq101TabBar.vue'

const store = useChampionDataStore()
const state = store.qq101
const controller = useInstance(ChampionDataRenderer).qq101

const { t } = useTranslation()

const managedPage = computed(() =>
  state.pages.items.find(
    (p): p is Extract<Qq101PageState, { kind: 'champion' }> =>
      p.kind === 'champion' && Boolean(p.currentGame) && p.id === state.pages.activeId
  )
)

const activeId = computed({
  get: () => state.pages.activeId,
  set: (id: string) => controller.pages.activate(id)
})

const tabOrder = computed({
  get: () => ['rankings', ...state.pages.items.map((page) => page.id)],
  set: (ids: string[]) => controller.pages.reorder(ids.filter((id) => id !== 'rankings'))
})

// Keep mounted content stable: tab sorting must not reinsert page DOM.
const contentPages = computed(() =>
  state.pages.items.toSorted((first, second) => first.id.localeCompare(second.id))
)

const preferences = computed(() => state.requestedPreferences ?? store.settings.qq101Preferences)

const refreshPage = (id: string) => {
  if (id === 'rankings') {
    return controller.changePreferences({})
  }

  return controller.pages.refresh(id)
}
</script>
