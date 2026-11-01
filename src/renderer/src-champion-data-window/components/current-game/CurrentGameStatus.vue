<template>
  <NAlert class="my-1" :show-icon="false" :type="error ? 'warning' : 'info'">
    <div class="flex items-center justify-between gap-2">
      <div class="min-w-0 text-xs">
        <div>
          {{ t('opgg.automation.currentGame') }} · {{ t(`opgg.automation.status.${status}`) }}
        </div>
        <div v-if="error" class="mt-1 break-words">{{ error.split('\n')[0] }}</div>
      </div>
      <NButton
        v-if="status === 'applyError'"
        size="tiny"
        secondary
        @click="controller.currentGame.retryApplication()"
      >
        {{ t('opgg.automation.retryApply') }}
      </NButton>
      <NButton v-else-if="loadError" size="tiny" secondary @click="refresh">
        {{ t('opgg.filters.refresh') }}
      </NButton>
    </div>
  </NAlert>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { ChampionDataRenderer } from '@renderer-shared/shards/champion-data'
import { useChampionDataStore } from '@renderer-shared/shards/champion-data/store'
import type { ChampionDataSourceId } from '@shared/types/champion-data'
import { useTranslation } from 'i18next-vue'
import { NAlert, NButton } from 'naive-ui'
import { computed } from 'vue'

const { source } = defineProps<{ source: ChampionDataSourceId }>()
const { t } = useTranslation()
const store = useChampionDataStore()
const controller = useInstance(ChampionDataRenderer)
const page = computed(() =>
  source === 'opgg' ? controller.opgg.currentGamePage : controller.qq101.pages.currentGamePage
)
const loadError = computed(() => {
  const current = page.value
  if (!current) return null
  if ('status' in current) return current.status === 'error' ? current.error : null
  if (current.modeChange.status === 'error') return current.modeChange.message
  const runes = current.view?.mode === 'ranked' ? current.view.sections.runes : null
  return runes?.status === 'error' ? runes.message : null
})
const status = computed(() =>
  store.currentGame.status === 'preset'
    ? 'preset'
    : (page.value?.currentGame?.unavailableReason ??
      (loadError.value
        ? 'loadError'
        : source !== store.settings.sourcePreferences.defaultSource
          ? 'otherSource'
          : store.currentGame.status))
)
const error = computed(
  () => loadError.value ?? (status.value === 'applyError' ? store.currentGame.error : null)
)
const refresh = () => {
  if (source === 'opgg') void controller.opgg.refresh(controller.opgg.currentGamePageId)
  else {
    const page = controller.qq101.pages.currentGamePage
    if (page) void controller.qq101.pages.refresh(page.id)
  }
}
</script>
