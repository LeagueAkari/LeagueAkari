<template>
  <div class="flex flex-col">
    <NCollapseTransition :show="as2.temporarilyDisabled" class="mb-4">
      <NAlert type="warning">
        <div class="mb-1 text-sm text-gray-700 dark:text-gray-200">
          {{ t('automation.champSelect.temporarilyDisabled.description') }}
        </div>
        <NButton size="small" type="primary" @click="as.setTemporarilyDisabled(false)">
          {{ t('automation.champSelect.temporarilyDisabled.button') }}
        </NButton>
      </NAlert>
    </NCollapseTransition>

    <!-- 可选分组列表 -->
    <div class="flex gap-4">
      <div class="flex shrink-0 flex-col" v-if="as2.groups.length > 0">
        <div class="mb-1 ml-2 text-xs text-gray-600 dark:text-gray-300">
          {{ t('automation.champSelect.groupTitle') }}
        </div>
        <div class="flex flex-col gap-0.5">
          <div
            class="flex h-7 w-44 cursor-pointer items-center rounded px-2 text-sm text-gray-700 transition-colors duration-200 dark:text-gray-100"
            :class="[
              currentGroupId === group.groupId
                ? 'bg-black/10 text-gray-900 dark:bg-white/15 dark:text-white'
                : 'text-black/90 hover:bg-black/5 hover:text-gray-900 dark:text-white/90 dark:hover:bg-white/10 dark:hover:text-white'
            ]"
            v-for="group in as2.groups"
            :key="group.groupId"
            @click="currentGroupId = group.groupId"
          >
            <LcuImage
              class="mr-2 h-4 w-4"
              :src="gameModeIconUri[group.targetGameModes[0].gameMode]"
            />
            <span class="flex-1 truncate">{{
              t(`automation.champSelect.groups.${group.groupId}`, { defaultValue: group.groupId })
            }}</span>
            <div class="ml-auto flex gap-1">
              <NIcon
                class="text-base text-emerald-600 dark:text-emerald-300"
                v-if="as2.settings.pickConfig[group.groupId]?.enabled"
              >
                <CheckmarkIcon />
              </NIcon>
              <NIcon
                class="text-base text-amber-600 dark:text-amber-300"
                v-if="as2.settings.banConfig[group.groupId]?.enabled"
              >
                <CheckmarkIcon />
              </NIcon>
            </div>
          </div>
        </div>
      </div>

      <!-- 一般来说这里不会抵达 -->
      <div class="flex h-full items-center justify-center" v-else>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          {{ t('automation.champSelect.groupEmpty') }}
        </div>
      </div>

      <!-- 右侧配置区域 -->
      <NTabs
        size="small"
        type="line"
        animated
        class="flex-1"
        v-if="currentGroup && currentPickConfig"
        v-model:value="banPick"
      >
        <NTabPane name="pick" :tab="t('automation.champSelect.pick.title')">
          <SettingsRow
            :label="t('automation.champSelect.pick.enabled.label')"
            :label-description="t('automation.champSelect.pick.enabled.description')"
            :label-width="260"
          >
            <NSwitch
              size="small"
              :value="currentPickConfig.enabled"
              @update:value="(val) => as.setPickConfig(currentGroup!.groupId, { enabled: val })"
            />
          </SettingsRow>

          <SettingsRow
            :label="t('automation.champSelect.pick.expectedChampions.label')"
            :label-description="t('automation.champSelect.pick.expectedChampions.description')"
            :label-width="260"
            control-full-line
            align="start"
          >
            <div v-if="currentGroup.positions.length > 1">
              <div
                class="mb-1 flex items-center gap-2"
                v-for="position in currentGroup.positions"
                :key="position"
              >
                <NTooltip placement="left">
                  <template #trigger>
                    <PositionIcon
                      :position="position"
                      class="shrink-0 text-lg text-gray-900 dark:text-white"
                    />
                  </template>
                  <span
                    >{{ t('automation.champSelect.pick.expectedChampions.fragment1') }}
                    <span class="font-semibold">{{
                      t(`positions.${position}`, { ns: 'common' })
                    }}</span>
                    {{ t('automation.champSelect.pick.expectedChampions.fragment2') }}</span
                  >
                </NTooltip>
                <OrderedChampionList
                  type="pick"
                  :allow-bravery="currentGroup.additionalPicks.includes(-3)"
                  :allow-dummy="!currentGroup.excludedPicks.includes(-1)"
                  :champions="currentPickConfig.champions[position]"
                  @update:champions="
                    (val) =>
                      as.setPickConfig(currentGroup!.groupId, { champions: { [position]: val } })
                  "
                />
              </div>
            </div>
            <div
              v-if="currentGroup.positions.length === 1 && currentGroup.positions[0] === 'default'"
            >
              <div class="mb-1 flex items-center gap-2">
                <PositionIcon
                  position="all"
                  class="shrink-0 text-lg text-gray-900 dark:text-white"
                />
                <OrderedChampionList
                  type="pick"
                  :allow-bravery="currentGroup.additionalPicks.includes(-3)"
                  :allow-dummy="!currentGroup.excludedPicks.includes(-1)"
                  :champions="currentPickConfig.champions.default"
                  @update:champions="
                    (val) =>
                      as.setPickConfig(currentGroup!.groupId, { champions: { default: val } })
                  "
                />
              </div>
            </div>
          </SettingsRow>

          <SettingsRow
            :label="t('automation.champSelect.pick.showIntent.label')"
            :label-description="t('automation.champSelect.pick.showIntent.description')"
            :label-width="260"
          >
            <NSwitch
              size="small"
              :value="currentPickConfig.showIntent"
              @update:value="(val) => as.setPickConfig(currentGroup!.groupId, { showIntent: val })"
            />
          </SettingsRow>

          <SettingsRow
            :label="t('automation.champSelect.pick.ignoreIntent.label')"
            :label-description="t('automation.champSelect.pick.ignoreIntent.description')"
            :label-width="260"
          >
            <NSwitch
              size="small"
              :value="currentPickConfig.ignoreIntent"
              @update:value="
                (val) => as.setPickConfig(currentGroup!.groupId, { ignoreIntent: val })
              "
            />
          </SettingsRow>

          <SettingsRow
            :label="t('automation.champSelect.pick.strategy.label')"
            :label-description="t('automation.champSelect.pick.strategy.description')"
            :label-width="260"
            align="start"
          >
            <NRadioGroup
              size="small"
              :value="currentPickConfig.strategy"
              @update:value="(val) => as.setPickConfig(currentGroup!.groupId, { strategy: val })"
            >
              <NFlex vertical :size="2">
                <NRadio value="just-show">{{
                  t('automation.champSelect.pick.strategy.options.just-show')
                }}</NRadio>
                <NRadio value="show-and-lock-in">{{
                  t('automation.champSelect.pick.strategy.options.show-and-lock-in')
                }}</NRadio>
                <NRadio value="lock-in-immediately">{{
                  t('automation.champSelect.pick.strategy.options.lock-in-immediately')
                }}</NRadio>
              </NFlex>
            </NRadioGroup>
          </SettingsRow>

          <SettingsRow
            :label="t('automation.champSelect.pick.delaySeconds.label')"
            :label-description="t('automation.champSelect.pick.delaySeconds.description')"
            :label-width="260"
          >
            <NInputNumber
              size="small"
              :value="currentPickConfig.delaySeconds"
              class="w-28!"
              @update:value="
                (val) => as.setPickConfig(currentGroup!.groupId, { delaySeconds: val || 0 })
              "
            />
          </SettingsRow>

          <div
            class="mx-(--settings-row-x-padding) mb-3 border-t border-gray-200 dark:border-white/20"
          ></div>
          <TooltipWithIcon
            class="mx-(--settings-row-x-padding) mb-2 text-xs text-gray-600 dark:text-gray-300"
            :tooltip="t('automation.champSelect.pick.benchMode.tooltip')"
          >
            <div>{{ t('automation.champSelect.pick.benchMode.title') }}</div>
          </TooltipWithIcon>

          <SettingsRow
            :label="t('automation.champSelect.pick.benchSwapAccumulatedDelaySeconds.label')"
            :label-description="
              t('automation.champSelect.pick.benchSwapAccumulatedDelaySeconds.description')
            "
            :label-width="260"
          >
            <NInputNumber
              size="small"
              class="w-28!"
              :value="currentPickConfig.benchSwapAccumulatedDelaySeconds"
              @update:value="
                (val) =>
                  as.setPickConfig(currentGroup!.groupId, {
                    benchSwapAccumulatedDelaySeconds: val || 0
                  })
              "
            />
          </SettingsRow>

          <SettingsRow
            :label="t('automation.champSelect.pick.benchSelectFirstAvailableChampion.label')"
            :label-description="
              t('automation.champSelect.pick.benchSelectFirstAvailableChampion.description')
            "
            :label-width="260"
          >
            <NSwitch
              size="small"
              :value="currentPickConfig.benchSelectFirstAvailableChampion"
              @update:value="
                (val) =>
                  as.setPickConfig(currentGroup!.groupId, {
                    benchSelectFirstAvailableChampion: val
                  })
              "
            />
          </SettingsRow>

          <SettingsRow
            :label="t('automation.champSelect.pick.benchHandleTradeEnabled.label')"
            :label-description="
              t('automation.champSelect.pick.benchHandleTradeEnabled.description')
            "
            :label-width="260"
          >
            <NSwitch
              size="small"
              :value="currentPickConfig.benchHandleTradeEnabled"
              @update:value="
                (val) => as.setPickConfig(currentGroup!.groupId, { benchHandleTradeEnabled: val })
              "
            />
          </SettingsRow>
        </NTabPane>

        <NTabPane name="ban" :tab="t('automation.champSelect.ban.title')">
          <SettingsRow
            :label="t('automation.champSelect.ban.enabled.label')"
            :label-description="t('automation.champSelect.ban.enabled.description')"
            :label-width="260"
          >
            <NSwitch
              size="small"
              :value="currentBanConfig.enabled"
              @update:value="(val) => as.setBanConfig(currentGroup!.groupId, { enabled: val })"
            />
          </SettingsRow>

          <SettingsRow
            :label="t('automation.champSelect.ban.expectedChampions.label')"
            :label-description="t('automation.champSelect.ban.expectedChampions.description')"
            :label-width="260"
            align="start"
          >
            <NCollapseTransition :show="currentGroup.positions.length > 1">
              <div
                class="mb-1 flex items-center gap-2"
                v-for="position in currentGroup.positions"
                :key="position"
              >
                <NTooltip placement="left">
                  <template #trigger>
                    <PositionIcon
                      :position="position"
                      class="shrink-0 text-lg text-gray-900 dark:text-white"
                    />
                  </template>
                  <span
                    >{{ t('automation.champSelect.ban.expectedChampions.fragment1') }}
                    <span class="font-semibold">{{
                      t(`positions.${position}`, { ns: 'common' })
                    }}</span>
                    {{ t('automation.champSelect.ban.expectedChampions.fragment2') }}</span
                  >
                </NTooltip>
                <OrderedChampionList
                  type="ban"
                  :allow-bravery="currentGroup.additionalBans.includes(-3)"
                  :allow-dummy="!currentGroup.excludedBans.includes(-1)"
                  :champions="currentBanConfig.champions[position]"
                  @update:champions="
                    (val) =>
                      as.setBanConfig(currentGroup!.groupId, { champions: { [position]: val } })
                  "
                />
              </div>
            </NCollapseTransition>

            <NCollapseTransition
              :show="currentGroup.positions.length === 1 && currentGroup.positions[0] === 'default'"
            >
              <div class="mb-1 flex items-center gap-2">
                <PositionIcon
                  position="all"
                  class="shrink-0 text-lg text-gray-900 dark:text-white"
                />
                <OrderedChampionList
                  type="ban"
                  :allow-bravery="currentGroup.additionalBans.includes(-3)"
                  :allow-dummy="!currentGroup.excludedBans.includes(-1)"
                  :champions="currentBanConfig.champions.default"
                  @update:champions="
                    (val) => as.setBanConfig(currentGroup!.groupId, { champions: { default: val } })
                  "
                />
              </div>
            </NCollapseTransition>
          </SettingsRow>

          <SettingsRow
            :label="t('automation.champSelect.ban.strategy.label')"
            :label-description="t('automation.champSelect.ban.strategy.description')"
            :label-width="260"
            align="start"
          >
            <NRadioGroup
              size="small"
              :value="currentBanConfig.strategy"
              @update:value="(val) => as.setBanConfig(currentGroup!.groupId, { strategy: val })"
            >
              <NFlex vertical :size="2">
                <NRadio value="just-show">{{
                  t('automation.champSelect.ban.strategy.options.just-show')
                }}</NRadio>
                <NRadio value="show-and-lock-in">{{
                  t('automation.champSelect.ban.strategy.options.show-and-lock-in')
                }}</NRadio>
                <NRadio value="lock-in-immediately">{{
                  t('automation.champSelect.ban.strategy.options.lock-in-immediately')
                }}</NRadio>
              </NFlex>
            </NRadioGroup>
          </SettingsRow>

          <SettingsRow
            :label="t('automation.champSelect.ban.delaySeconds.label')"
            :label-description="t('automation.champSelect.ban.delaySeconds.description')"
            :label-width="260"
          >
            <NInputNumber
              size="small"
              class="w-28!"
              :value="currentBanConfig.delaySeconds"
              @update:value="
                (val) => as.setBanConfig(currentGroup!.groupId, { delaySeconds: val || 0 })
              "
            />
          </SettingsRow>
        </NTabPane>
      </NTabs>

      <!-- 一般来说这里不会抵达 -->
      <div class="as-editor__empty-selected-group" v-else>
        <div class="as-editor__empty-selected-group-title">
          {{ t('automation.champSelect.groupEmpty') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import TooltipWithIcon from '@renderer-shared/components/TooltipWithIcon.vue'
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import { useInstance } from '@renderer-shared/shards'
import { AutoSelectRenderer } from '@renderer-shared/shards/auto-select'
import { useAutoSelectStore } from '@renderer-shared/shards/auto-select/store'
import { Checkmark as CheckmarkIcon } from '@vicons/carbon'
import { useTranslation } from 'i18next-vue'
import {
  NAlert,
  NButton,
  NCollapseTransition,
  NFlex,
  NIcon,
  NInputNumber,
  NRadio,
  NRadioGroup,
  NSwitch,
  NTabPane,
  NTabs,
  NTooltip
} from 'naive-ui'
import { computed, ref, watch } from 'vue'

import OrderedChampionList from './components/ordered-champion-list/OrderedChampionList.vue'
import { useMapAssets } from '@main-window/composables/useMapAssets'

const { t } = useTranslation()

const as = useInstance(AutoSelectRenderer)
const as2 = useAutoSelectStore()

const currentGroupId = ref('ranked')
const banPick = ref('pick')

const currentPickConfig = computed(() => {
  return as2.settings.pickConfig[currentGroupId.value]
})

const currentBanConfig = computed(() => {
  return as2.settings.banConfig[currentGroupId.value]
})

const currentGroup = computed(() => {
  return as2.groups.find((m) => m.groupId === currentGroupId.value)
})

const mapAssets = useMapAssets()
const gameModeIconUri = computed(() => {
  if (!mapAssets.value) {
    return {}
  }

  const gameModeUri: Record<string, string> = {}
  const flattened = Object.values(mapAssets.value).flat()

  for (const item of flattened) {
    if (gameModeUri[item.gameMode]) {
      continue
    }

    gameModeUri[item.gameMode] = item.assets?.['game-select-icon-hover']
  }

  return gameModeUri
})

watch(
  () => currentPickConfig.value,
  (value) => {
    if (!value) {
      as.setPickConfig(currentGroupId.value, {})
    }
  },
  { immediate: true }
)

watch(
  () => currentBanConfig.value,
  (value) => {
    if (!value) {
      as.setBanConfig(currentGroupId.value, {})
    }
  },
  { immediate: true }
)

watch(
  () => as2.activeGroupConfigId,
  (value) => {
    if (value) {
      currentGroupId.value = value
    }
  },
  { immediate: true }
)
</script>
