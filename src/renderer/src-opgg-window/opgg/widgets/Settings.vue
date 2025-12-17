<template>
  <div
    class="box-border size-full overflow-hidden rounded-lg bg-neutral-100 p-5 dark:bg-neutral-800"
  >
    <!-- header -->
    <div class="flex items-center justify-between">
      <span class="text-2xl font-bold text-black dark:text-white">{{
        t('Opgg.settings.title')
      }}</span>
      <div
        class="flex size-9 cursor-pointer items-center justify-center rounded-md text-[22px] transition-colors hover:bg-black/10 active:bg-black/8 dark:hover:bg-white/10 dark:active:bg-white/8"
        @click="emits('close')"
      >
        <NIcon>
          <Close />
        </NIcon>
      </div>
    </div>

    <!-- settings -->
    <div class="mt-6">
      <ControlItem
        class="control-item-margin justify-between"
        :label="t('Opgg.settings.enabled.label')"
        :label-description="t('Opgg.settings.enabled.description')"
        :label-width="300"
      >
        <NSwitch
          @update:value="(val) => wm.opggWindow.setEnabled(val)"
          :value="ows.settings.enabled"
          size="small"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin justify-between"
        :label="t('Opgg.settings.flashPosition.label')"
        :label-description="t('Opgg.settings.flashPosition.description')"
        :label-width="300"
      >
        <NRadioGroup size="small" :value="flashPosition" @update:value="setFlashPosition">
          <div class="flex flex-col gap-1">
            <NRadio value="d" :title="t('Opgg.settings.flashPosition.options.d')">D</NRadio>
            <NRadio value="f" :title="t('Opgg.settings.flashPosition.options.f')">F</NRadio>
            <NRadio value="auto" :title="t('Opgg.settings.flashPosition.options.auto')">
              {{ t('Opgg.settings.flashPosition.auto') }}
            </NRadio>
          </div>
        </NRadioGroup>
      </ControlItem>
      <ControlItem
        class="control-item-margin justify-between"
        :label="t('Opgg.settings.autoApplyRunes.label')"
        :label-description="t('Opgg.settings.autoApplyRunes.description')"
        :label-width="300"
      >
        <NSwitch v-model:value="os.frontendSettings.autoApplyRunes" size="small" />
      </ControlItem>
      <ControlItem
        class="control-item-margin justify-between"
        :label="t('Opgg.settings.autoApplySpells.label')"
        :label-description="t('Opgg.settings.autoApplySpells.description')"
        :label-width="300"
      >
        <NSwitch v-model:value="os.frontendSettings.autoApplySpells" size="small" />
      </ControlItem>
      <ControlItem
        class="control-item-margin justify-between"
        :label="t('Opgg.settings.autoApplyItems.label')"
        :label-description="t('Opgg.settings.autoApplyItems.description')"
        :label-width="300"
      >
        <NSwitch v-model:value="os.frontendSettings.autoApplyItems" size="small" />
      </ControlItem>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useOpggStore } from '@opgg-window/shards/opgg/store'
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useOpggWindowStore } from '@renderer-shared/shards/window-manager/store'
import { Close } from '@vicons/ionicons5'
import { useTranslation } from 'i18next-vue'
import { NIcon, NRadio, NRadioGroup, NSwitch } from 'naive-ui'

import { useOpgg } from '../context'

const { t } = useTranslation()

const ows = useOpggWindowStore()
const os = useOpggStore()

const wm = useInstance(WindowManagerRenderer)

const { flashPosition, setFlashPosition } = useOpgg()

const emits = defineEmits<{
  close: []
}>()
</script>
