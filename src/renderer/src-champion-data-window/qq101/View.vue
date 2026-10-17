<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <Tabs
      :pages="state.pages.items"
      v-model:active-id="activeId"
      v-model:order="tabOrder"
      :loading="state.isLoading"
      @close="controller.pages.close($event)"
      @refresh="refreshPage"
    />
    <Rankings
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
      <Details
        v-if="page.kind === 'champion' && page.view"
        v-show="state.pages.activeId === page.id"
        :view="page.view"
        :patches="state.patches"
        :mode-change="page.modeChange"
        @mode="controller.pages.changeHeroMode(page.id, $event)"
        @champion="controller.selectChampion($event, undefined, page.id)"
        @position="updatePosition(page, $event)"
        @retry="controller.pages.retry(page.id, $event)"
        @preferences="updatePreferences(page, $event)"
      />
      <Pairs
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
import { useInstance } from '@renderer-shared/shards'
import { ChampionDataRenderer } from '@renderer-shared/shards/champion-data'
import { useChampionDataStore } from '@renderer-shared/shards/champion-data/store'
import type { Qq101Page } from '@renderer-shared/shards/champion-data/qq101/types'
import type { Qq101ChampionDataPreferences } from '@shared/types/champion-data'
import { computed } from 'vue'
import Rankings from './Rankings.vue'
import Details from './details/Details.vue'
import Pairs from './pairs/Pairs.vue'
import Tabs from './Tabs.vue'

const store = useChampionDataStore()
const state = store.qq101
const controller = useInstance(ChampionDataRenderer).qq101

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
  if (id === 'rankings') return controller.changePreferences({})

  return controller.pages.refresh(id)
}

const updatePosition = (page: Extract<Qq101Page, { kind: 'champion' }>, position: string) => {
  if (page.query.mode === 'ranked')
    return controller.pages.updateHero(page.id, { ...page.query, position })

  return Promise.resolve()
}

const updatePreferences = (
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

  return Promise.resolve()
}
</script>
