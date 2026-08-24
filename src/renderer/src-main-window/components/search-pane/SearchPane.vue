<template>
  <NModal v-model:show="show" transform-origin="center" @after-enter="handleAfterEnter">
    <div
      class="h-160 max-h-[90vh] w-200 max-w-[90vw]"
      role="dialog"
      aria-modal="true"
      :aria-label="t('titlebar.search.open')"
    >
      <div
        class="search-pane flex h-full flex-col overflow-hidden rounded-lg border border-solid border-white/10 bg-neutral-100 dark:bg-neutral-900"
      >
        <NTabs
          class="search-pane__tabs"
          :value="page"
          type="line"
          size="small"
          :animated="false"
          :tabs-padding="16"
          :tab-style="searchTabStyle"
          :pane-style="searchPaneStyle"
          :theme-overrides="searchTabsThemeOverrides"
          @update:value="handlePageUpdate"
        >
          <NTabPane v-if="leagueClient.isConnected" name="summoner" display-directive="show">
            <template #tab>
              <span class="inline-flex items-center gap-1.5">
                <NIcon size="16" aria-hidden="true">
                  <PeopleSearch24RegularIcon />
                </NIcon>
                <span>{{ t('titlebar.search.summoner') }}</span>
              </span>
            </template>

            <SummonerSearch
              ref="summoner-search"
              @navigate-to-summoner="handleNavigateToSummoner"
            />
          </NTabPane>

          <NTabPane name="settings" display-directive="show">
            <template #tab>
              <span class="inline-flex items-center gap-1.5">
                <NIcon size="16" aria-hidden="true">
                  <SearchSettings20RegularIcon />
                </NIcon>
                <span>{{ t('titlebar.search.settings') }}</span>
              </span>
            </template>

            <SettingsSearch
              ref="settings-search"
              @navigate="emit('navigateToSetting', $event)"
              @close="show = false"
            />
          </NTabPane>
        </NTabs>
      </div>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import {
  PeopleSearch24Regular as PeopleSearch24RegularIcon,
  SearchSettings20Regular as SearchSettings20RegularIcon
} from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NIcon, NModal, NTabPane, NTabs, useDialog } from 'naive-ui'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'

import type { SettingsNavigationTargetId } from '@main-window/settings-navigation'

import SettingsSearch from './SettingsSearch.vue'
import SummonerSearch from './summoner-search/SummonerSearch.vue'
import type { SearchPanePage } from './types'

const emit = defineEmits<{
  navigateToSummoner: [puuid: string, sgpServerId: string | null, setCurrent?: boolean]
  navigateToSetting: [targetId: SettingsNavigationTargetId]
}>()

const show = defineModel<boolean>('show', { default: false })
const page = defineModel<SearchPanePage>('page', { default: 'settings' })

const { t } = useTranslation()
const dialog = useDialog()
const appCommon = useAppCommonStore()
const leagueClient = useLeagueClientStore()
const summonerSearch = useTemplateRef<InstanceType<typeof SummonerSearch>>('summoner-search')
const settingsSearch = useTemplateRef<InstanceType<typeof SettingsSearch>>('settings-search')
const summonerWarningShown = ref(false)
const modalEntered = ref(false)
const searchTabStyle = { height: '44px', padding: '0 1px' }
const searchPaneStyle = { padding: '0' }
const searchTabsThemeOverrides = { tabGapSmallLine: '24px' }

const requireSummonerConfirmation = computed(
  () => appCommon.settings.streamerMode && !summonerWarningShown.value
)

const activateCurrentPage = () => {
  if (page.value === 'summoner' && leagueClient.isConnected) {
    summonerSearch.value?.reset()
  } else {
    settingsSearch.value?.activate()
  }
}

const cancelSummonerSearch = () => {
  summonerSearch.value?.cancel()
}

const handleAfterEnter = () => {
  modalEntered.value = true
  activateCurrentPage()
}

const handleNavigateToSummoner = (
  puuid: string,
  sgpServerId: string | null,
  setCurrent?: boolean
) => {
  emit('navigateToSummoner', puuid, sgpServerId, setCurrent)
}

const selectSummonerPage = (confirmed: boolean) => {
  if (!leagueClient.isConnected || (requireSummonerConfirmation.value && !confirmed)) {
    return
  }

  if (confirmed) {
    summonerWarningShown.value = true
  }

  page.value = 'summoner'
}

const handlePageUpdate = (value: string | number) => {
  if (value !== 'summoner' && value !== 'settings') {
    return
  }

  if (value === 'settings') {
    page.value = value
    return
  }

  if (requireSummonerConfirmation.value) {
    dialog.warning({
      title: t('titlebar.search.streamerModeTitle'),
      content: t('titlebar.search.streamerModeWarning'),
      positiveText: t('titlebar.search.continue'),
      negativeText: t('titlebar.search.cancel'),
      onPositiveClick: () => selectSummonerPage(true)
    })
    return
  }

  selectSummonerPage(false)
}

watch(
  () => leagueClient.isConnected,
  (connected) => {
    if (!connected && page.value === 'summoner') {
      page.value = 'settings'
    }
  },
  { immediate: true }
)

watch([show, requireSummonerConfirmation], ([visible, confirmationRequired]) => {
  if (visible && confirmationRequired && page.value === 'summoner') {
    page.value = 'settings'
  }
})

watch(show, (visible) => {
  if (visible) {
    return
  }

  modalEntered.value = false
  cancelSummonerSearch()
})

watch(page, () => {
  if (modalEntered.value) {
    void nextTick(activateCurrentPage)
  }
})
</script>

<style scoped>
.search-pane {
  color: var(--la-color-text-primary);
  box-shadow: 0 20px 56px rgba(0, 0, 0, 0.28);
  -webkit-app-region: no-drag;
}

.search-pane__tabs {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
}

.search-pane__tabs > :deep(.n-tabs-nav) {
  flex-shrink: 0;
  border-bottom: 1px solid color-mix(in oklch, var(--la-color-text-primary) 10%, transparent);
}

.search-pane__tabs > :deep(.n-tab-pane) {
  box-sizing: border-box;
  height: 0;
  min-height: 0;
  flex: 1 1 0;
  overflow: hidden;
}
</style>
