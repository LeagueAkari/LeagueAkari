<template>
  <NTabs ref="tabs" type="line" size="small" :tabs-padding="12" :pane-style="{ padding: '0' }">
    <NTabPane v-for="source in CHAMPION_DATA_SOURCE_ORDER" :key="source" :name="source">
      <template #tab>
        <span class="flex items-center gap-1.5">
          <OpggIcon v-if="source === 'opgg'" class="size-4 shrink-0" />
          <span
            v-else
            class="flex h-4 min-w-5 shrink-0 items-center justify-center rounded-sm border border-current px-0.5 text-[9px] leading-none font-bold"
            aria-hidden="true"
          >
            101
          </span>
          <span>{{ t(`opgg.filters.sources.${source}`) }}</span>
          <NTag
            v-if="sourcePreferences.defaultSource === source"
            size="tiny"
            type="info"
            :bordered="false"
          >
            {{ t('opgg.view.settings.sources.default') }}
          </NTag>
        </span>
      </template>
      <SettingsRow
        :label="
          t('opgg.view.settings.sources.enableLabel', {
            source: t(`opgg.filters.sources.${source}`)
          })
        "
        :label-description="t('opgg.view.settings.sources.enableDescription')"
      >
        <NSwitch
          :value="sourcePreferences.enabled[source]"
          :disabled="saving"
          :aria-label="
            t('opgg.view.settings.sources.enableLabel', {
              source: t(`opgg.filters.sources.${source}`)
            })
          "
          size="small"
          @update:value="(enabled) => setSourceEnabled(source, enabled)"
        />
      </SettingsRow>
      <SettingsRow
        :label="t('opgg.view.settings.sources.defaultSource')"
        :label-description="t('opgg.view.settings.sources.defaultDescription')"
      >
        <NSwitch
          :value="sourcePreferences.defaultSource === source"
          size="small"
          :disabled="
            saving ||
            !sourcePreferences.enabled[source] ||
            sourcePreferences.defaultSource === source
          "
          :aria-label="
            t('opgg.view.settings.sources.defaultLabel', {
              source: t(`opgg.filters.sources.${source}`)
            })
          "
          @update:value="() => setDefaultSource(source)"
        />
      </SettingsRow>
      <SettingsRow
        :label="t('opgg.automation.preferences')"
        :label-description="t('opgg.automation.preferencesDescription')"
        control-full-line
      >
        <div v-if="source === 'opgg'" class="flex w-full gap-2">
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <span class="text-xs text-black/55 dark:text-white/55">{{
              t('opgg.filters.region')
            }}</span>
            <QuerySelect
              kind="region"
              :aria-label="t('opgg.filters.region')"
              :disabled="savingAutomation"
              :options="regionOptions"
              :value="automation.opgg.region"
              @update:value="
                emit('update:automation', {
                  ...automation,
                  opgg: { ...automation.opgg, region: $event }
                })
              "
            />
          </div>
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <span class="text-xs text-black/55 dark:text-white/55">{{
              t('opgg.filters.rankTier')
            }}</span>
            <QuerySelect
              kind="tier"
              :aria-label="t('opgg.filters.rankTier')"
              :disabled="savingAutomation"
              :options="tierOptions"
              :value="automation.opgg.tier"
              @update:value="
                emit('update:automation', {
                  ...automation,
                  opgg: { ...automation.opgg, tier: $event }
                })
              "
            />
          </div>
        </div>
        <div v-else class="flex w-full flex-col gap-1">
          <span class="text-xs text-black/55 dark:text-white/55">{{ t('qq101.tier') }}</span>
          <QuerySelect
            kind="tier"
            :aria-label="t('qq101.tier')"
            :disabled="savingAutomation"
            :options="qq101Tiers"
            :value="automation.qq101.tier"
            @update:value="emit('update:automation', { ...automation, qq101: { tier: $event } })"
          />
        </div>
      </SettingsRow>
    </NTabPane>
  </NTabs>
</template>

<script setup lang="ts">
import QuerySelect from '@champion-data-window/components/query-filter/QuerySelect.vue'
import { useRegionOptions, useTierOptions } from '@champion-data-window/opgg/utils/options'
import { useTierOptions as useQq101TierOptions } from '@champion-data-window/qq101/filters'
import OpggIcon from '@renderer-shared/assets/icon/OpggIcon.vue'
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import { useInstance } from '@renderer-shared/shards'
import { ChampionDataRenderer } from '@renderer-shared/shards/champion-data'
import { useChampionDataStore } from '@renderer-shared/shards/champion-data/store'
import type { ChampionDataAutomationSettings } from '@shared/shards/champion-data/automation'
import {
  CHAMPION_DATA_SOURCE_ORDER,
  type ChampionDataSourceId,
  type ChampionDataSourcePreferences
} from '@shared/types/champion-data'
import { useTranslation } from 'i18next-vue'
import { NSwitch, NTabPane, NTabs, NTag, type TabsInst, useMessage } from 'naive-ui'
import { computed, ref, useTemplateRef, watch } from 'vue'

defineProps<{
  automation: ChampionDataAutomationSettings
  savingAutomation: boolean
}>()

const emit = defineEmits<{
  'update:automation': [value: ChampionDataAutomationSettings]
}>()

const { t } = useTranslation()
const championData = useInstance(ChampionDataRenderer)
const store = useChampionDataStore()
const sourcePreferences = computed(() => store.settings.sourcePreferences)
const tabs = useTemplateRef<TabsInst>('tabs')
const saving = ref(false)
const message = useMessage()
const { regionOptions } = useRegionOptions()
const { tierOptions } = useTierOptions()
const { tierOptions: qq101Tiers } = useQq101TierOptions()

const saveSources = async (preferences: ChampionDataSourcePreferences) => {
  saving.value = true

  try {
    await championData.setSourcePreferences(preferences)
  } catch {
    message.error(t('opgg.view.settings.sources.saveFailed'))
  } finally {
    saving.value = false
  }
}

const setSourceEnabled = (source: ChampionDataSourceId, enabled: boolean) =>
  saveSources({
    ...sourcePreferences.value,
    enabled: { ...sourcePreferences.value.enabled, [source]: enabled }
  })

const setDefaultSource = (source: ChampionDataSourceId) =>
  saveSources({
    ...sourcePreferences.value,
    defaultSource: source
  })

watch(
  () => sourcePreferences.value.defaultSource,
  () => tabs.value?.syncBarPosition(),
  { flush: 'post' }
)
</script>
