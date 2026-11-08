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
    <template v-for="page in contentPages" :key="page.id">
      <Qq101ChampionTab
        v-if="page.kind === 'champion' && page.view"
        v-show="state.pages.activeId === page.id"
        :view="page.view"
        :read-only="Boolean(page.currentGame)"
        :applying="store.applying.runes"
        @apply-runes="applyRunes(page.id, $event)"
        :patches="state.patches"
        :mode-change="page.modeChange"
        @mode="controller.pages.changeHeroMode(page.id, $event)"
        @champion="controller.selectChampion($event, undefined, page.id)"
        @position="updatePosition(page, $event)"
        @retry="controller.pages.retry(page.id, $event)"
        @preferences="updatePreferences(page, $event)"
      />
      <Qq101PairsTab
        v-else-if="page.kind === 'pairs'"
        v-show="state.pages.activeId === page.id"
        :page="page"
        :champion-ids="championIds"
        @query="controller.pages.updatePairs(page.id, $event)"
        @champion="controller.selectChampion($event, undefined, page.id)"
      />
    </template>
  </div>
</template>
<script setup lang="ts">
import { NEmpty, useMessage } from 'naive-ui'
import { useTranslation } from 'i18next-vue'

import { useInstance } from '@renderer-shared/shards'
import { ChampionDataRenderer } from '@champion-data-window/shards/champion-data'
import { useChampionDataStore } from '@champion-data-window/shards/champion-data/store'
import type { Qq101Page } from '@champion-data-window/shards/champion-data/qq101/types'
import type { Qq101ChampionDataPreferences } from '@shared/types/champion-data'
import { isAbortError } from '@shared/utils/queue-keeper'
import { computed } from 'vue'
import Qq101RankingsTab from './rankings-tab/Qq101RankingsTab.vue'
import Qq101ChampionTab from './champion-tab/Qq101ChampionTab.vue'
import Qq101PairsTab from './Qq101PairsTab.vue'
import Qq101TabBar from './Qq101TabBar.vue'

const store = useChampionDataStore()
const state = store.qq101
const controller = useInstance(ChampionDataRenderer).qq101

const { t } = useTranslation()
const message = useMessage()

const managedPage = computed(() =>
  state.pages.items.find(
    (p): p is Extract<Qq101Page, { kind: 'champion' }> =>
      p.kind === 'champion' && Boolean(p.currentGame) && p.id === state.pages.activeId
  )
)

const applyRunes = async (id: string, index: number) => {
  if (store.applying.runes) {
    return
  }

  try {
    await controller.applyRunes(id, index)

    message.success(t('opgg.automation.status.applied'))
  } catch (error) {
    if (isAbortError(error)) {
      return
    }

    message.warning(t('opgg.view.setRunesFailedMessage', { reason: String(error) }))
  }
}

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

const championIds = computed(() => [
  ...new Set(state.overview?.data.champions.map((c) => c.championId) ?? [])
])

const refreshPage = (id: string) => {
  if (id === 'rankings') {
    return controller.changePreferences({})
  }

  return controller.pages.refresh(id)
}

const updatePosition = async (page: Extract<Qq101Page, { kind: 'champion' }>, position: string) => {
  if (page.query.mode === 'ranked') {
    return controller.pages.updateHero(page.id, { ...page.query, position })
  }
}

const updatePreferences = async (
  page: Extract<Qq101Page, { kind: 'champion' }>,
  update: Partial<Qq101ChampionDataPreferences>
) => {
  if (page.query.mode === 'ranked') {
    return controller.pages.updateHero(page.id, {
      ...page.query,
      patch: update.patch ?? page.query.patch,
      tier: update.tier ?? page.query.tier
    })
  }
}
</script>
