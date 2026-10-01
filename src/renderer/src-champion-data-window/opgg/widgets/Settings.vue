<template>
  <div
    class="box-border size-full overflow-hidden rounded-lg bg-neutral-100 px-2 py-4 dark:bg-neutral-800"
  >
    <SettingsSection no-bg>
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold text-black/80 dark:text-white/90">
            {{ t('opgg.view.settings.title') }}
          </span>
          <NIcon
            class="cursor-pointer rounded text-lg text-black/50 transition-colors hover:bg-black/8 hover:text-black/80 dark:text-white/50 hover:dark:bg-white/8 dark:hover:text-white/80"
            @click="$emit('close')"
          >
            <Close />
          </NIcon>
        </div>
      </template>
      <SettingsRow
        :label="t('settings.multiWindow.championDataWindow.enabled.label')"
        :label-description="t('settings.multiWindow.championDataWindow.enabled.description')"
      >
        <NSwitch
          @update:value="(val) => wm.championDataWindow.setEnabled(val)"
          :value="championDataWindowStore.settings.enabled"
          size="small"
        />
      </SettingsRow>
      <SettingsRow
        :label="t('opgg.view.settings.flashPosition.label')"
        :label-description="t('opgg.view.settings.flashPosition.description')"
        align="start"
      >
        <NRadioGroup size="small" :value="flashPosition" @update:value="setFlashPosition">
          <div class="flex flex-col gap-1">
            <NRadio value="d" :title="t('opgg.view.settings.flashPosition.options.d')">D</NRadio>
            <NRadio value="f" :title="t('opgg.view.settings.flashPosition.options.f')">F</NRadio>
            <NRadio value="auto" :title="t('opgg.view.settings.flashPosition.options.auto')">
              {{ t('opgg.view.settings.flashPosition.auto') }}
            </NRadio>
          </div>
        </NRadioGroup>
      </SettingsRow>
      <SettingsRow
        :label="t('opgg.view.settings.autoApplyRunes.label')"
        :label-description="t('opgg.view.settings.autoApplyRunes.description')"
      >
        <div class="flex items-center gap-2">
          <span class="text-[11px] text-black/45 dark:text-white/45">
            {{ t('opgg.view.settings.temporarilyUnavailable') }}
          </span>
          <NSwitch :value="false" size="small" disabled />
        </div>
      </SettingsRow>
      <SettingsRow
        :label="t('opgg.view.settings.autoApplySpells.label')"
        :label-description="t('opgg.view.settings.autoApplySpells.description')"
      >
        <div class="flex items-center gap-2">
          <span class="text-[11px] text-black/45 dark:text-white/45">
            {{ t('opgg.view.settings.temporarilyUnavailable') }}
          </span>
          <NSwitch :value="false" size="small" disabled />
        </div>
      </SettingsRow>
      <SettingsRow
        :label="t('opgg.view.settings.autoApplyItems.label')"
        :label-description="t('opgg.view.settings.autoApplyItems.description')"
      >
        <div class="flex items-center gap-2">
          <span class="text-[11px] text-black/45 dark:text-white/45">
            {{ t('opgg.view.settings.temporarilyUnavailable') }}
          </span>
          <NSwitch :value="false" size="small" disabled />
        </div>
      </SettingsRow>
    </SettingsSection>
  </div>
</template>

<script setup lang="ts">
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useInstance } from '@renderer-shared/shards'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useChampionDataWindowStore } from '@renderer-shared/shards/window-manager/store'
import { Close } from '@vicons/ionicons5'
import { useTranslation } from 'i18next-vue'
import { NIcon, NRadio, NRadioGroup, NSwitch } from 'naive-ui'

import { useOpgg } from '../context'

const { t } = useTranslation()

const championDataWindowStore = useChampionDataWindowStore()

const wm = useInstance(WindowManagerRenderer)

const { flashPosition, setFlashPosition } = useOpgg()

defineEmits<{
  close: []
}>()
</script>
