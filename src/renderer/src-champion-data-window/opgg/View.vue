<template>
  <div class="relative flex flex-col px-2 pt-1 pb-2">
    <TabAndFilters class="mb-1" />

    <NEmpty
      v-if="isDataUnavailable"
      class="flex min-h-0 flex-1 items-center justify-center"
      :description="t('opgg.view.dataUnavailable')"
    />
    <div v-else class="relative min-h-0 flex-1" :aria-busy="isLoading">
      <ChampionTable v-show="currentTab === 'champions' && champions !== null" class="h-full" />
      <ChampionPage
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
          <ChampionPagePlaceholder
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
          </ChampionPagePlaceholder>

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

    <SessionChampions />
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue'
import ChampionPagePlaceholder from '@champion-data-window/components/champion-page/ChampionPagePlaceholder.vue'
import { NButton, NEmpty, NSpin } from 'naive-ui'
import { computed } from 'vue'

import ChampionPage from './ChampionPage.vue'
import ChampionTable from './ChampionTable.vue'
import TabAndFilters from './TabAndFilters.vue'
import { useOpgg } from './context'
import SessionChampions from './widgets/SessionChampions.vue'

const { t } = useTranslation()
const {
  currentTab,
  championId,
  champion,
  champions,
  isDataUnavailable,
  isLoading,
  isDataStale,
  error,
  openedPages,
  activePage,
  cancel,
  refresh
} = useOpgg()

// Keep mounted content stable: tab sorting must not reinsert page DOM.
const contentPageIds = computed(() => openedPages.value.toSorted((first, second) => first - second))

const hasData = computed(() => {
  if (currentTab.value === 'champion') {
    return champion.value !== null
  }

  return champions.value !== null
})
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
