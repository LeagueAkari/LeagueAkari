<template>
  <div class="flex min-h-0 flex-col">
    <div
      v-if="!activeSource"
      role="status"
      class="flex min-h-0 flex-1 items-center justify-center px-6 text-center"
    >
      <div class="flex max-w-80 flex-col items-center gap-3">
        <div class="text-sm font-medium text-black/70 dark:text-white/75">
          {{ canEnableSources ? t('opgg.sources.noneEnabled') : unavailableDescription }}
        </div>
        <div v-if="canEnableSources" class="text-xs text-black/45 dark:text-white/45">
          {{ t('opgg.sources.enableDescription') }}
        </div>
        <NButton v-if="canEnableSources" size="small" secondary @click="router.push('/settings')">
          {{ t('opgg.sources.openSettings') }}
        </NButton>
      </div>
    </div>
    <KeepAlive>
      <Qq101Tabs v-if="activeSource === 'qq101'" class="h-0 min-h-0 flex-1" />
      <OpggTabs v-else-if="activeSource === 'opgg'" class="h-0 min-h-0 flex-1" />
    </KeepAlive>
  </div>
</template>

<script setup lang="ts">
import type { ChampionDataSourceId } from '@shared/types/champion-data'
import { useTranslation } from 'i18next-vue'
import { NButton } from 'naive-ui'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import OpggTabs from '../opgg/OpggTabs.vue'
import Qq101Tabs from '../qq101/Qq101Tabs.vue'

const props = defineProps<{
  activeSource: ChampionDataSourceId | null
  allSourcesDisabled: boolean
  settingsAvailable: boolean
  minimumUpgradeVersion: string | null
}>()

const { t } = useTranslation()
const router = useRouter()
const canEnableSources = computed(() => props.settingsAvailable && props.allSourcesDisabled)
const unavailableDescription = computed(() =>
  props.minimumUpgradeVersion
    ? t('opgg.sources.updateRequired', { version: props.minimumUpgradeVersion })
    : t('opgg.sources.unavailable')
)
</script>
