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
      <div class="flex shrink-0 flex-col" v-if="visibleGroups.length > 0">
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
            v-for="group in visibleGroups"
            :key="group.groupId"
            @click="currentGroupId = group.groupId"
          >
            <LcuImage class="mr-2 h-4 w-4" :src="group.iconPath" />
            <span class="flex-1 truncate">
              {{ group.name[app.settings.locale === 'en' ? 'en' : 'zh-CN'] }}
            </span>
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
        :animated="tabsAnimated"
        class="flex-1"
        v-if="currentGroup && currentPickConfig && currentBanConfig"
        v-model:value="banPick"
      >
        <NTabPane name="pick" :tab="t('automation.champSelect.pick.title')">
          <SettingsRow
            setting-id="automation.champ-select.pick.enabled"
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
            setting-id="automation.champ-select.pick.expected-champions"
            :label="t('automation.champSelect.pick.expectedChampions.label')"
            :label-description="t('automation.champSelect.pick.expectedChampions.description')"
            :label-width="260"
            control-full-line
            align="start"
          >
            <div v-if="currentGroup.positions.length > 1" class="w-full">
              <div
                class="mb-1 flex w-full items-center gap-2"
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
              class="w-full"
            >
              <div class="mb-1 flex w-full items-center gap-2">
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
            setting-id="automation.champ-select.pick.show-intent"
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
            setting-id="automation.champ-select.pick.ignore-intent"
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
            setting-id="automation.champ-select.pick.strategy"
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
            setting-id="automation.champ-select.pick.delay"
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
            setting-id="automation.champ-select.pick.bench-swap-delay"
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
            setting-id="automation.champ-select.pick.bench-first"
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
            setting-id="automation.champ-select.pick.bench-handle-trade"
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
            setting-id="automation.champ-select.ban.enabled"
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
            setting-id="automation.champ-select.ban.expected-champions"
            :label="t('automation.champSelect.ban.expectedChampions.label')"
            :label-description="t('automation.champSelect.ban.expectedChampions.description')"
            :label-width="260"
            control-full-line
            align="start"
          >
            <NCollapseTransition class="w-full" :show="currentGroup.positions.length > 1">
              <div
                class="mb-1 flex w-full items-center gap-2"
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
              class="w-full"
              :show="currentGroup.positions.length === 1 && currentGroup.positions[0] === 'default'"
            >
              <div class="mb-1 flex w-full items-center gap-2">
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
            setting-id="automation.champ-select.ban.strategy"
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
            setting-id="automation.champ-select.ban.delay"
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
import { useAkariNavigationStep } from '@renderer-shared/shards/akari-navigation'
import SettingsRow from '@main-window/settings-navigation/NavigableSettingsRow.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import TooltipWithIcon from '@renderer-shared/components/TooltipWithIcon.vue'
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { AutoSelectRenderer } from '@renderer-shared/shards/auto-select'
import { useAutoSelectStore } from '@renderer-shared/shards/auto-select/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { isAutoSelectGroupSupportedOnSgpServer } from '@shared/shards/akari-api'
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
import { computed, nextTick, ref, watch } from 'vue'

import {
  AUTO_SELECT_NAVIGATION_STEP_KEY,
  type AutoSelectNavigationPayload
} from './auto-select-navigation'
import OrderedChampionList from './components/ordered-champion-list/OrderedChampionList.vue'

const { t } = useTranslation()

const app = useAppCommonStore()
const as = useInstance(AutoSelectRenderer)
const as2 = useAutoSelectStore()
const sgp = useSgpStore()

const currentGroupId = ref('ranked')
const banPick = ref('pick')
const tabsAnimated = ref(true)
let navigationActivationSequence = 0

useAkariNavigationStep<AutoSelectNavigationPayload>({
  key: AUTO_SELECT_NAVIGATION_STEP_KEY,
  activate: async (payload, { signal }) => {
    const targetGroupId = payload.groupId ?? currentGroup.value?.groupId

    if (!targetGroupId || !visibleGroups.value.some((group) => group.groupId === targetGroupId)) {
      return { status: 'unavailable', reason: 'auto-select-group-unavailable' }
    }

    if (currentGroupId.value === targetGroupId && banPick.value === payload.tab) {
      await nextTick()
      return undefined
    }

    const sequence = ++navigationActivationSequence
    tabsAnimated.value = false
    currentGroupId.value = targetGroupId
    banPick.value = payload.tab
    await nextTick()

    if (sequence === navigationActivationSequence) {
      tabsAnimated.value = true
    }
    if (!signal.aborted) {
      await nextTick()
    }
    return undefined
  }
})

const visibleGroups = computed(() => {
  return as2.groups.filter((group) =>
    isAutoSelectGroupSupportedOnSgpServer(
      group,
      sgp.availability.sgpServerId,
      sgp.leagueServers.servers
    )
  )
})

const currentGroup = computed(() => {
  return visibleGroups.value.find((group) => group.groupId === currentGroupId.value)
})

const currentPickConfig = computed(() => {
  return currentGroup.value ? as2.settings.pickConfig[currentGroup.value.groupId] : undefined
})

const currentBanConfig = computed(() => {
  return currentGroup.value ? as2.settings.banConfig[currentGroup.value.groupId] : undefined
})

watch(
  () => currentPickConfig.value,
  (value) => {
    if (currentGroup.value && !value) {
      as.setPickConfig(currentGroup.value.groupId, {})
    }
  },
  { immediate: true }
)

watch(
  () => currentBanConfig.value,
  (value) => {
    if (currentGroup.value && !value) {
      as.setBanConfig(currentGroup.value.groupId, {})
    }
  },
  { immediate: true }
)

watch(
  [visibleGroups, () => as2.activeGroupConfigId],
  ([groups, activeGroupConfigId]) => {
    if (activeGroupConfigId && groups.some((group) => group.groupId === activeGroupConfigId)) {
      currentGroupId.value = activeGroupConfigId
      return
    }

    if (!groups.some((group) => group.groupId === currentGroupId.value)) {
      currentGroupId.value = groups[0]?.groupId ?? ''
    }
  },
  { immediate: true }
)
</script>
