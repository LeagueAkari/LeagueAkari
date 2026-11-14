<template>
  <div class="relative flex flex-col px-2 pt-1 pb-2">
    <div class="mb-1">
      <OpggTabToolbar
        :snapshot="snapshot"
        @activate="activatePage"
        @close="closePage"
        @close-others="closeOtherPages"
        @reorder="reorderPages"
        @refresh="refreshPage"
      />
      <OpggQueryFilters
        v-if="!managedPage?.currentGame?.unavailableReason"
        :query="pageState.query"
        :version="pageState.version"
        :versions="pageState.versions"
        :read-only="Boolean(managedPage)"
        @change="changeQuery"
      />
    </div>

    <NEmpty
      v-if="managedPage?.currentGame?.unavailableReason"
      class="flex min-h-0 flex-1 items-center justify-center"
      :description="t(`opgg.automation.status.${managedPage.currentGame.unavailableReason}`)"
    />
    <NEmpty
      v-else-if="isDataUnavailable"
      class="flex min-h-0 flex-1 items-center justify-center"
      :description="t('opgg.view.dataUnavailable')"
    />
    <div v-else class="relative min-h-0 flex-1" :aria-busy="isLoading">
      <OpggRankingsTab
        v-show="currentTab === 'champions' && champions !== null"
        :champions="champions"
        :is-loading="snapshot.overviewState.status === 'loading'"
        class="h-full"
        @champion="openChampion"
      />
      <OpggChampionTab
        v-for="id in contentPageIds"
        :key="id"
        :page-id="id"
        v-show="activePage === id"
        class="h-full"
      />

      <Transition name="opgg-status" appear>
        <div
          v-if="!hasData || error || isDataStale || (isLoading && currentTab === 'champion')"
          :key="isLoading ? 'loading' : 'empty'"
          class="absolute inset-0 z-10 flex items-center justify-center p-4"
          :class="{ 'is-loading': isLoading }"
        >
          <ChampionTabPlaceholder
            v-if="currentTab === 'champion' && championId"
            :champion-id="championId"
            :loading="isLoading"
            :description="isLoading ? t('opgg.view.loading') : error || t('opgg.view.notLoaded')"
          >
            <template #actions>
              <NButton v-if="isLoading" size="small" secondary @click="cancel">
                {{ t('opgg.champion.cancel') }}
              </NButton>
              <NButton v-else size="small" secondary @click="refresh">
                {{ t('opgg.filters.refresh') }}
              </NButton>
            </template>
          </ChampionTabPlaceholder>

          <div v-else class="flex max-w-full flex-col items-center gap-3 text-center" role="status">
            <template v-if="isLoading">
              <NSpin size="large" />
              <div class="text-sm text-black/65 dark:text-white/65">
                {{ t('opgg.view.loading') }}
              </div>
              <NButton size="small" secondary @click="cancel">
                {{ t('opgg.champion.cancel') }}
              </NButton>
            </template>
            <template v-else>
              <div class="text-sm text-black/65 dark:text-white/65">
                {{ error || t('opgg.view.notLoaded') }}
              </div>
              <NButton size="small" secondary @click="refresh">
                {{ t('opgg.filters.refresh') }}
              </NButton>
            </template>
          </div>
        </div>
      </Transition>
    </div>

    <SessionChampions @champion="openChampion" />
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue'
import ChampionTabPlaceholder from '@champion-data-window/components/champion-tab/ChampionTabPlaceholder.vue'
import { NButton, NEmpty, NSpin, useMessage } from 'naive-ui'
import { computed } from 'vue'

import OpggChampionTab from './champion-tab/OpggChampionTab.vue'
import OpggRankingsTab from './OpggRankingsTab.vue'
import OpggTabToolbar from './OpggTabToolbar.vue'
import { ChampionDataRenderer } from '@champion-data-window/shards/champion-data'
import { useChampionDataStore } from '@champion-data-window/shards/champion-data/store'
import { useInstance } from '@renderer-shared/shards'
import type { OpggChampionDataQueryUpdate } from '@shared/types/champion-data/opgg'
import OpggQueryFilters from './filters/OpggQueryFilters.vue'
import SessionChampions from './widgets/SessionChampions.vue'

const store = useChampionDataStore()
const controller = useInstance(ChampionDataRenderer).opgg
const { t } = useTranslation()
const message = useMessage()

const snapshot = computed(() => store.opgg.snapshot)
const activePage = computed(() => snapshot.value.activePage)
const openedPages = computed(() => snapshot.value.openedPages)
const currentTab = computed(() => (activePage.value === null ? 'champions' : 'champion'))

const pageState = computed(() =>
  activePage.value === null ? snapshot.value.overviewState : snapshot.value.pages[activePage.value]
)
const managedPage = computed(() => {
  const page = activePage.value === null ? null : snapshot.value.pages[activePage.value]

  return page?.currentGame ? page : null
})

const championId = computed(() => pageState.value.query.championId)
const champion = computed(() =>
  activePage.value === null ? null : snapshot.value.pages[activePage.value].champion
)
const champions = computed(() => snapshot.value.overview)

const isLoading = computed(() => pageState.value.status === 'loading')
const isDataStale = computed(() => pageState.value.stale)
const error = computed(() => pageState.value.error)
const isDataUnavailable = computed(() => !store.opgg.enabled)

// Keep mounted content stable: tab sorting must not reinsert page DOM.
const contentPageIds = computed(() => openedPages.value.toSorted((first, second) => first - second))

const hasData = computed(() => {
  if (currentTab.value === 'champion') {
    return champion.value !== null
  }

  return champions.value !== null
})

const run = async (request: () => Promise<unknown>) => {
  try {
    await request()
  } catch (error) {
    message.error(String(error))
  }
}

const activatePage = (id: number | null) => run(() => controller.activate(id))

const closePage = (id: number) => run(() => controller.close(id))

const closeOtherPages = (id: number | null) =>
  run(async () => {
    for (const pageId of openedPages.value) {
      if (pageId !== id && !snapshot.value.pages[pageId].currentGame) {
        await controller.close(pageId)
      }
    }
  })

const reorderPages = (ids: number[]) => run(() => controller.reorder(ids))

const refreshPage = (id: number | null) => run(() => controller.refresh(id))

const refresh = () => refreshPage(activePage.value)

const cancel = () => controller.cancel(activePage.value)

const openChampion = (id: number) => run(() => controller.open(id, activePage.value))

const changeQuery = (query: OpggChampionDataQueryUpdate) =>
  run(() => controller.update(query, activePage.value))
</script>

<style scoped>
.opgg-status-enter-active {
  transition: opacity 180ms ease-out;
}

.opgg-status-enter-active.is-loading {
  transition-delay: 120ms;
}

.opgg-status-leave-active {
  pointer-events: none;
  transition: opacity 120ms ease-out;
}

.opgg-status-enter-from,
.opgg-status-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .opgg-status-enter-active,
  .opgg-status-leave-active {
    transition: none;
  }
}
</style>
