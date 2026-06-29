<template>
  <div class="h-full w-full">
    <NScrollbar class="relative h-full max-w-full">
      <div class="mx-auto flex max-w-[800px] flex-col gap-6 p-6">
        <SettingsSection :title="t('toolkit.client.gameClient.title')">
          <SettingsRow
            :disabled="!as.nativeSupport.nativeInput.available"
            :label="
              nativeInputRequiresElevation
                ? t('toolkit.client.gameClient.terminateGameClientWithShortcut.labelAdminRequired')
                : t('toolkit.client.gameClient.terminateGameClientWithShortcut.label')
            "
            :label-width="320"
          >
            <template #labelDescription>
              <div>
                {{ t('toolkit.client.gameClient.terminateGameClientWithShortcut.description') }}
              </div>
              <div
                v-if="!as.nativeSupport.nativeInput.available"
                class="mt-1 text-xs text-yellow-700/80 dark:text-yellow-300/80"
              >
                {{ nativeInputStatusDescription }}
              </div>
            </template>
            <NSwitch
              :disabled="!as.nativeSupport.nativeInput.available"
              size="small"
              type="warning"
              :value="gcs.settings.terminateGameClientWithShortcut"
              @update:value="(v) => gc.setTerminateGameClientWithShortcut(v)"
            />
          </SettingsRow>
          <SettingsRow
            :disabled="!as.nativeSupport.nativeInput.available"
            :label="
              nativeInputRequiresElevation
                ? t('toolkit.client.gameClient.terminateShortcut.labelAdminRequired')
                : t('toolkit.client.gameClient.terminateShortcut.label')
            "
            :label-width="320"
          >
            <template #labelDescription>
              <div>{{ t('toolkit.client.gameClient.terminateShortcut.description') }}</div>
              <div
                v-if="!as.nativeSupport.nativeInput.available"
                class="mt-1 text-xs text-yellow-700/80 dark:text-yellow-300/80"
              >
                {{ nativeInputStatusDescription }}
              </div>
            </template>
            <ShortcutSelector
              :target-id="GameClientRenderer.SHORTCUT_ID_TERMINATE_GAME_CLIENT"
              :shortcut-id="gcs.settings.terminateShortcut"
              @update:shortcut-id="(v) => gc.setTerminateShortcut(v)"
            />
          </SettingsRow>
          <SettingsRow
            :label-description="t('toolkit.client.gameClient.settingsFileMode.description')"
            :label-width="320"
          >
            <template #label>
              <TooltipWithIcon>
                <span>{{ t('toolkit.client.gameClient.settingsFileMode.label') }}</span>
                <template #tooltip>
                  <div class="max-w-70 text-xs leading-relaxed font-normal">
                    <div class="space-y-1.5">
                      <div>
                        {{ t('toolkit.client.gameClient.settingsFileMode.details.readonly') }}
                      </div>
                      <div>
                        {{ t('toolkit.client.gameClient.settingsFileMode.details.writable') }}
                      </div>
                      <div>{{ t('toolkit.client.gameClient.settingsFileMode.details.scope') }}</div>
                    </div>
                  </div>
                </template>
              </TooltipWithIcon>
            </template>
            <NSwitch
              size="small"
              :value="isSettingsFileLocked"
              :loading="settingFileModeChanging"
              :disabled="!lcs.isConnected"
              @update:value="handleSettingsFileModeSwitch"
            />
          </SettingsRow>
        </SettingsSection>
        <SettingsSection :title="t('toolkit.client.leagueClientUx.title')">
          <SettingsRow
            :disabled="!adjustLeagueClientWindowSizeSupported"
            :label="
              adjustWindowRequiresElevation
                ? t('toolkit.client.leagueClientUx.fixWindowMethodAOptions.labelAdminRequired')
                : t('toolkit.client.leagueClientUx.fixWindowMethodAOptions.label')
            "
            :label-width="320"
          >
            <template #labelDescription>
              <div
                v-html="t('toolkit.client.leagueClientUx.fixWindowMethodAOptions.description')"
              ></div>
              <div
                v-if="!adjustLeagueClientWindowSizeSupported"
                class="mt-1 text-xs text-yellow-700/80 dark:text-yellow-300/80"
              >
                {{ adjustWindowStatusDescription }}
              </div>
            </template>
            <div class="flex max-w-full items-baseline gap-1">
              <NInputNumber
                class="w-20!"
                size="small"
                :disabled="!adjustLeagueClientWindowSizeSupported || !lcs.isConnected"
                :show-button="false"
                :min="1"
                @update:value="(val) => (fixWindowMethodAOptions.baseWidth = val || 0)"
                :value="fixWindowMethodAOptions.baseWidth"
                @keyup.enter="() => fixWindowInputButton2?.focus()"
              >
                <template #prefix>W</template>
              </NInputNumber>
              <NInputNumber
                ref="input-2"
                class="w-20!"
                :disabled="!adjustLeagueClientWindowSizeSupported || !lcs.isConnected"
                size="small"
                :show-button="false"
                :min="1"
                @update:value="(val) => (fixWindowMethodAOptions.baseHeight = val || 0)"
                :value="fixWindowMethodAOptions.baseHeight"
                @keyup.enter="() => handleFixWindowMethodA()"
                ><template #prefix>H</template>
              </NInputNumber>
              <NButton
                :disabled="!adjustLeagueClientWindowSizeSupported || !lcs.isConnected"
                size="small"
                secondary
                type="warning"
                @click="handleFixWindowMethodA"
                >{{ t('toolkit.client.leagueClientUx.fixWindowMethodAOptions.button') }}</NButton
              >
            </div>
          </SettingsRow>
        </SettingsSection>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import TooltipWithIcon from '@renderer-shared/components/TooltipWithIcon.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { GameClientRenderer } from '@renderer-shared/shards/game-client'
import { useGameClientStore } from '@renderer-shared/shards/game-client/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NButton, NInputNumber, NScrollbar, NSwitch, useDialog, useMessage } from 'naive-ui'
import { computed, reactive, ref, toRaw, useTemplateRef, watch } from 'vue'

import ShortcutSelector from '@main-window/components/ShortcutSelector.vue'

const { t } = useTranslation()

const as = useAppCommonStore()
const lcs = useLeagueClientStore()
const gcs = useGameClientStore()

const lc = useInstance(LeagueClientRenderer)
const gc = useInstance(GameClientRenderer)

const dialog = useDialog()

const nativeInputRequiresElevation = computed(
  () => as.nativeSupport.nativeInput.requiresElevation && !as.isElevated
)
const nativeInputStatusDescription = computed(() =>
  as.nativeSupport.nativeInput.availableOnCurrentPlatform
    ? t('toolkit.client.gameClient.nativeAddonRequiresAdministrator')
    : t('toolkit.client.gameClient.windowsOnlyNativeAddon')
)

const adjustWindowRequirement = computed(() => as.nativeSupport.adjustLeagueClientWindowSize)
const adjustWindowRequiresElevation = computed(
  () => adjustWindowRequirement.value.requiresElevation && !as.isElevated
)
const adjustLeagueClientWindowSizeSupported = computed(
  () => adjustWindowRequirement.value.available
)
const adjustWindowStatusDescription = computed(() =>
  adjustWindowRequirement.value.availableOnCurrentPlatform
    ? t('toolkit.client.leagueClientUx.fixWindowMethodAOptions.requiresAdministrator')
    : t('toolkit.client.leagueClientUx.fixWindowMethodAOptions.unsupportedCurrentPlatform')
)

const fixWindowInputButton2 = useTemplateRef('input-2')

const fixWindowMethodAOptions = reactive({
  baseWidth: 1280,
  baseHeight: 720
})

const handleFixWindowMethodA = async () => {
  dialog.warning({
    title: t('toolkit.client.leagueClientUx.fixWindowMethodAOptions.dialog.title'),
    content: t('toolkit.client.leagueClientUx.fixWindowMethodAOptions.dialog.content'),
    positiveText: t('toolkit.client.leagueClientUx.fixWindowMethodAOptions.dialog.positiveText'),
    negativeText: t('toolkit.client.leagueClientUx.fixWindowMethodAOptions.dialog.negativeText'),
    onPositiveClick: async () => {
      try {
        await lc.fixWindowMethodA(toRaw(fixWindowMethodAOptions))
      } catch (error) {
        console.error(error)
      }
    }
  })
}

const message = useMessage()

const settingFileMode = ref<'readonly' | 'writable' | 'unavailable'>('unavailable')
const settingFileModeChanging = ref(false)
const isSettingsFileLocked = computed(() => settingFileMode.value === 'readonly')

watch(
  () => lcs.isConnected,
  async (isConnected) => {
    if (isConnected) {
      settingFileMode.value = await gc
        .getSettingsFileReadonlyOrWritable()
        .catch(() => 'unavailable')
    } else {
      settingFileMode.value = 'unavailable'
    }
  },
  { immediate: true }
)

const handleSetSettingsFileMode = async (mode: 'readonly' | 'writable') => {
  try {
    settingFileModeChanging.value = true
    await gc.setSettingsFileReadonlyOrWritable(mode)
    settingFileMode.value = await gc.getSettingsFileReadonlyOrWritable()

    if (mode === 'readonly') {
      message.success(t('toolkit.client.gameClient.settingsFileMode.setToReadonly'))
    } else {
      message.success(t('toolkit.client.gameClient.settingsFileMode.setToWritable'))
    }
  } catch (error: any) {
    message.warning(
      t('toolkit.client.gameClient.settingsFileMode.failedToSet', {
        reason: error.message
      })
    )
    settingFileMode.value = 'unavailable'
  } finally {
    settingFileModeChanging.value = false
  }
}

const handleSettingsFileModeSwitch = (locked: boolean) => {
  return handleSetSettingsFileMode(locked ? 'readonly' : 'writable')
}
</script>
