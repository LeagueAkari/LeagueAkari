<template>
  <div
    class="box-border flex size-full flex-col gap-3 rounded-lg border border-solid border-white/10 bg-neutral-100 p-3 dark:bg-neutral-900"
  >
    <div class="mb-2 flex flex-wrap items-center justify-between gap-3">
      <div class="flex min-w-0 items-center gap-3">
        <div class="flex min-w-0 items-center gap-2 text-base font-bold">
          <NIcon class="shrink-0 text-base"><Filter20Regular /></NIcon>
          <span class="truncate">{{ t('PlayerTab.filter.title') }}</span>
        </div>
      </div>

      <div class="ml-auto flex shrink-0 items-center gap-3">
        <NRadioGroup v-model:value="activeMode" size="small" :disabled="!!collectState">
          <NRadioButton value="simple">
            {{ t('PlayerTab.filter.simpleTab') }}
          </NRadioButton>
          <NRadioButton value="advanced">
            {{ t('PlayerTab.filter.advancedTab') }}
          </NRadioButton>
        </NRadioGroup>

        <div class="h-6 w-px bg-black/10 dark:bg-white/10"></div>

        <NButton
          :disabled="!rootHasCombinator || !!collectState"
          tertiary
          size="small"
          type="warning"
          @click="clearFilters"
        >
          <template #icon>
            <NIcon size="14"><RefreshFilled /></NIcon>
          </template>
          {{ t('PlayerTab.filter.resetAll') }}
        </NButton>

        <NTooltip>
          <template #trigger>
            <span>
              <NButton
                :disabled="!rootHasCombinator || !!collectState"
                size="small"
                type="primary"
                @click="handleOpenCollectModeSettingsModal"
              >
                <span class="inline-flex items-center gap-1">
                  <span>{{ t('PlayerTab.collectMode.openSettings') }}</span>
                  <NIcon size="13" class="opacity-70"><Info16Regular /></NIcon>
                </span>
              </NButton>
            </span>
          </template>
          <div class="max-w-60 space-y-2">
            <div>
              {{ t('PlayerTab.collectMode.tooltipDescription') }}
            </div>
            <div>{{ t('PlayerTab.collectMode.tooltipUseCase') }}</div>
          </div>
        </NTooltip>
      </div>
    </div>

    <div class="min-h-0 flex-1">
      <SimpleMatchHistoryFilter v-if="activeMode === 'simple'" v-model="simpleFilterState" />
      <AdvancedMatchHistoryFilter v-else v-model="advancedFilterState" />
    </div>

    <NModal v-model:show="showCollectModeSettingsModal">
      <div
        class="rounded-lg border border-solid border-white/10 bg-neutral-100 p-3 dark:bg-neutral-900"
      >
        <div class="mb-3 text-base font-bold text-black dark:text-white">
          {{ t('PlayerTab.collectMode.settingsTitle') }}
        </div>

        <div class="mb-3">
          <ControlItem
            class="control-item-margin"
            :label="t('PlayerTab.collectMode.countPerIterationLabel')"
            :label-description="t('PlayerTab.collectMode.countPerIterationDescription')"
            :label-width="400"
          >
            <NInputNumber
              :step="5"
              :max="200"
              :min="1"
              style="width: 160px"
              size="small"
              v-model:value="collectModeSettings.countPerIteration"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('PlayerTab.collectMode.expectedCountLabel')"
            :label-description="t('PlayerTab.collectMode.expectedCountDescription')"
            :label-width="400"
          >
            <NInputNumber
              :step="5"
              :max="1000"
              :min="1"
              style="width: 160px"
              size="small"
              v-model:value="collectModeSettings.expectedCount"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('PlayerTab.collectMode.maxIterationLabel')"
            :label-description="t('PlayerTab.collectMode.maxIterationDescription')"
            :label-width="400"
          >
            <NInputNumber
              :step="1"
              :max="100"
              :min="1"
              style="width: 160px"
              size="small"
              v-model:value="collectModeSettings.maxIteration"
            />
          </ControlItem>
        </div>

        <div class="flex justify-end gap-2">
          <NButton size="small" tertiary @click="handleCloseCollectModeSettingsModal">
            {{ t('PlayerTab.collectMode.cancel') }}
          </NButton>
          <NButton
            type="primary"
            size="small"
            :disabled="isLoading || !!collectState"
            @click="handleCollect"
          >
            {{ t('PlayerTab.collectMode.startCollect') }}
          </NButton>
        </div>
      </div>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { Filter20Regular, Info16Regular } from '@vicons/fluent'
import { RefreshFilled } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NInputNumber, NModal, NRadioButton, NRadioGroup, NTooltip } from 'naive-ui'
import { computed, ref } from 'vue'

import { useMatchHistory } from '../../data/match-history'
import { usePlayerTab } from '../../context'
import AdvancedMatchHistoryFilter from './AdvancedMatchHistoryFilter.vue'
import SimpleMatchHistoryFilter from './SimpleMatchHistoryFilter.vue'
import {
  MatchHistoryFilterMode,
  MatchHistoryFilterState,
  SimpleMatchHistoryFilterState,
  clearPredicate as clearStatePredicate,
  clearSimplePredicate,
  createEmptySimpleState,
  createEmptyState,
  hasPredicate,
  hasSimplePredicate,
  toFilterState,
  toPredicate
} from './filter-state'

const emits = defineEmits<{
  collectBegin: []
}>()

const { t } = useTranslation()

const activeMode = defineModel<MatchHistoryFilterMode>('activeMode', {
  default: 'simple'
})
const simpleFilterState = defineModel<SimpleMatchHistoryFilterState>('simpleFilterState', {
  default: () => createEmptySimpleState()
})
const advancedFilterState = defineModel<MatchHistoryFilterState>('advancedFilterState', {
  default: () => createEmptyState()
})

const { preferredSource, isCrossRegion, sgpApiStatus, puuid, sgpServerId } = usePlayerTab()
const isSgpMatchHistorySource = computed(
  () => (preferredSource.value === 'sgp' || isCrossRegion.value) && sgpApiStatus.value.canUse
)

const activeFilterState = computed(() =>
  activeMode.value === 'simple'
    ? toFilterState(simpleFilterState.value, puuid.value, {
        enablePosition: isSgpMatchHistorySource.value
      })
    : advancedFilterState.value
)

const rootHasCombinator = computed(() =>
  activeMode.value === 'simple'
    ? hasSimplePredicate(simpleFilterState.value, {
        enablePosition: isSgpMatchHistorySource.value
      })
    : hasPredicate(advancedFilterState.value)
)

const { page, collectMatchHistory, collectState, isLoading } = useMatchHistory()

const collectModeSettings = ref({
  countPerIteration: 20,
  expectedCount: 20,
  maxIteration: 20
})

const showCollectModeSettingsModal = ref(false)

const clearFilters = () => {
  if (activeMode.value === 'simple') {
    simpleFilterState.value = clearSimplePredicate(simpleFilterState.value)
  } else {
    advancedFilterState.value = clearStatePredicate(advancedFilterState.value)
  }
}

const handleCollect = () => {
  if (isLoading.value || collectState.value) {
    return
  }

  const collectPredicate = toPredicate(activeFilterState.value)

  collectMatchHistory({
    predicate: collectPredicate,
    countPerIteration: collectModeSettings.value.countPerIteration,
    expectedCount: collectModeSettings.value.expectedCount,
    maxIteration: collectModeSettings.value.maxIteration,
    queryParams: {
      __sgpServerId: sgpServerId.value,
      tag: page.value?.queryParams.tag,
      tagsQueryType: page.value?.queryParams.tagsQueryType
    }
  })

  showCollectModeSettingsModal.value = false
  emits('collectBegin')
}

const handleOpenCollectModeSettingsModal = () => {
  showCollectModeSettingsModal.value = true
}

const handleCloseCollectModeSettingsModal = () => {
  showCollectModeSettingsModal.value = false
}
</script>
