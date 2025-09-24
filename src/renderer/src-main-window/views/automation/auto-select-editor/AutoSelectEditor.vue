<template>
  <div class="as-editor">
    <NCollapseTransition :show="as2.temporarilyDisabled" class="as-editor__temporary-disabled">
      <NAlert type="warning">
        <div class="as-editor__temporary-disabled-description">
          {{ t('AutoSelect.temporarilyDisabled.description') }}
        </div>
        <NButton size="small" type="primary" @click="as.setTemporarilyDisabled(false)">
          {{ t('AutoSelect.temporarilyDisabled.button') }}
        </NButton>
      </NAlert>
    </NCollapseTransition>

    <!-- 可选分组列表 -->
    <div class="as-editor__groups-container">
      <div class="as-editor__groups" v-if="as2.groups.length > 0">
        <div class="as-editor__groups-title">{{ t('AutoSelect.groupTitle') }}</div>
        <div class="as-editor__groups-list">
          <div
            class="as-editor__group-item"
            :class="{ 'as-editor__group-item--current': currentGroupId === group.groupId }"
            v-for="group in as2.groups"
            :key="group.groupId"
            @click="currentGroupId = group.groupId"
          >
            <LcuImage
              class="as-editor__group-icon"
              :src="gameModeIconUri[group.targetGameModes[0].gameMode]"
            />
            <span class="as-editor__group-label">{{
              t(`AutoSelect.groups.${group.groupId}`, { defaultValue: group.groupId })
            }}</span>
            <div class="as-editor__group-enabled-icon-wrapper">
              <NIcon
                class="as-editor__group-enabled-icon as-editor__group-enabled-icon--pick"
                v-if="as2.settings.pickConfig[group.groupId]?.enabled"
              >
                <CheckmarkIcon />
              </NIcon>
              <NIcon
                class="as-editor__group-enabled-icon as-editor__group-enabled-icon--ban"
                v-if="as2.settings.banConfig[group.groupId]?.enabled"
              >
                <CheckmarkIcon />
              </NIcon>
            </div>
          </div>
        </div>
      </div>

      <!-- 一般来说这里不会抵达 -->
      <div class="as-editor__empty-group" v-else>
        <div class="as-editor__empty-group-title">{{ t('AutoSelect.groupEmpty') }}</div>
      </div>

      <!-- 右侧配置区域 -->
      <NTabs
        size="small"
        type="line"
        animated
        class="as-editor__config"
        v-if="currentGroup && currentPickConfig"
        v-model:value="banPick"
      >
        <NTabPane name="pick" :tab="t('AutoSelect.pick.title')">
          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.pick.enabled.label')"
            :label-description="t('AutoSelect.pick.enabled.description')"
            :label-width="260"
          >
            <NSwitch
              size="small"
              :value="currentPickConfig.enabled"
              @update:value="(val) => as.setPickConfig(currentGroup!.groupId, { enabled: val })"
            />
          </ControlItem>

          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.pick.expectedChampions.label')"
            :label-description="t('AutoSelect.pick.expectedChampions.description')"
            :label-width="260"
          >
            <NCollapseTransition :show="currentGroup.positions.length > 1">
              <div
                class="as-editor__position"
                v-for="position in currentGroup.positions"
                :key="position"
              >
                <NTooltip placement="left">
                  <template #trigger>
                    <PositionIcon :position="position" class="as-editor__position-icon" />
                  </template>
                  <span
                    >{{ t('AutoSelect.pick.expectedChampions.fragment1') }}
                    <span style="font-weight: bold">{{ position }}</span>
                    {{ t('AutoSelect.pick.expectedChampions.fragment2') }}</span
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
            </NCollapseTransition>
            <NCollapseTransition
              :show="currentGroup.positions.length === 1 && currentGroup.positions[0] === 'default'"
            >
              <div class="as-editor__position">
                <PositionIcon position="all" class="as-editor__position-icon" />
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
            </NCollapseTransition>
          </ControlItem>

          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.pick.showIntent.label')"
            :label-description="t('AutoSelect.pick.showIntent.description')"
            :label-width="260"
          >
            <NSwitch
              size="small"
              :value="currentPickConfig.showIntent"
              @update:value="(val) => as.setPickConfig(currentGroup!.groupId, { showIntent: val })"
            />
          </ControlItem>

          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.pick.ignoreIntent.label')"
            :label-description="t('AutoSelect.pick.ignoreIntent.description')"
            :label-width="260"
          >
            <NSwitch
              size="small"
              :value="currentPickConfig.ignoreIntent"
              @update:value="
                (val) => as.setPickConfig(currentGroup!.groupId, { ignoreIntent: val })
              "
            />
          </ControlItem>

          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.pick.strategy.label')"
            :label-description="t('AutoSelect.pick.strategy.description')"
            :label-width="260"
          >
            <NRadioGroup
              size="small"
              :value="currentPickConfig.strategy"
              @update:value="(val) => as.setPickConfig(currentGroup!.groupId, { strategy: val })"
            >
              <NFlex vertical :size="2">
                <NRadio value="just-show">{{
                  t('AutoSelect.pick.strategy.options.just-show')
                }}</NRadio>
                <NRadio value="show-and-lock-in">{{
                  t('AutoSelect.pick.strategy.options.show-and-lock-in')
                }}</NRadio>
              </NFlex>
            </NRadioGroup>
          </ControlItem>

          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.pick.delaySeconds.label')"
            :label-description="t('AutoSelect.pick.delaySeconds.description')"
            :label-width="260"
          >
            <NInputNumber
              size="small"
              :value="currentPickConfig.delaySeconds"
              style="width: 120px"
              @update:value="
                (val) => as.setPickConfig(currentGroup!.groupId, { delaySeconds: val || 0 })
              "
            />
          </ControlItem>

          <div class="as-editor__bench-options-divider"></div>
          <TooltipWithIcon
            class="as-editor__subtitle"
            :tooltip="t('AutoSelect.pick.benchMode.tooltip')"
          >
            <div>{{ t('AutoSelect.pick.benchMode.title') }}</div>
          </TooltipWithIcon>

          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.pick.benchSwapAccumulatedDelaySeconds.label')"
            :label-description="t('AutoSelect.pick.benchSwapAccumulatedDelaySeconds.description')"
            :label-width="260"
          >
            <NInputNumber
              size="small"
              style="width: 120px"
              :value="currentPickConfig.benchSwapAccumulatedDelaySeconds"
              @update:value="
                (val) =>
                  as.setPickConfig(currentGroup!.groupId, {
                    benchSwapAccumulatedDelaySeconds: val || 0
                  })
              "
            />
          </ControlItem>

          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.pick.benchSelectFirstAvailableChampion.label')"
            :label-description="t('AutoSelect.pick.benchSelectFirstAvailableChampion.description')"
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
          </ControlItem>

          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.pick.benchHandleTradeEnabled.label')"
            :label-description="t('AutoSelect.pick.benchHandleTradeEnabled.description')"
            :label-width="260"
          >
            <NSwitch
              size="small"
              :value="currentPickConfig.benchHandleTradeEnabled"
              @update:value="
                (val) => as.setPickConfig(currentGroup!.groupId, { benchHandleTradeEnabled: val })
              "
            />
          </ControlItem>
        </NTabPane>

        <NTabPane name="ban" :tab="t('AutoSelect.ban.title')">
          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.ban.enabled.label')"
            :label-description="t('AutoSelect.ban.enabled.description')"
            :label-width="260"
          >
            <NSwitch
              size="small"
              :value="currentBanConfig.enabled"
              @update:value="(val) => as.setBanConfig(currentGroup!.groupId, { enabled: val })"
            />
          </ControlItem>

          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.ban.expectedChampions.label')"
            :label-description="t('AutoSelect.ban.expectedChampions.description')"
            :label-width="260"
          >
            <NCollapseTransition :show="currentGroup.positions.length > 1">
              <div
                class="as-editor__position"
                v-for="position in currentGroup.positions"
                :key="position"
              >
                <NTooltip placement="left">
                  <template #trigger>
                    <PositionIcon :position="position" class="as-editor__position-icon" />
                  </template>
                  <span
                    >{{ t('AutoSelect.ban.expectedChampions.fragment1') }}
                    <span style="font-weight: bold">{{
                      t(`positions.${position}`, { ns: 'common' })
                    }}</span>
                    {{ t('AutoSelect.ban.expectedChampions.fragment2') }}</span
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
              <div class="as-editor__position">
                <PositionIcon position="all" class="as-editor__position-icon" />
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
          </ControlItem>

          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.ban.ignoreIntent.label')"
            :label-description="t('AutoSelect.ban.ignoreIntent.description')"
            :label-width="260"
          >
            <NSwitch
              size="small"
              :value="currentBanConfig.ignoreIntent"
              @update:value="(val) => as.setBanConfig(currentGroup!.groupId, { ignoreIntent: val })"
            />
          </ControlItem>

          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.ban.strategy.label')"
            :label-description="t('AutoSelect.ban.strategy.description')"
            :label-width="260"
          >
            <NRadioGroup
              size="small"
              :value="currentBanConfig.strategy"
              @update:value="(val) => as.setBanConfig(currentGroup!.groupId, { strategy: val })"
            >
              <NFlex vertical :size="2">
                <NRadio value="just-show">{{
                  t('AutoSelect.ban.strategy.options.just-show')
                }}</NRadio>
                <NRadio value="show-and-lock-in">{{
                  t('AutoSelect.ban.strategy.options.show-and-lock-in')
                }}</NRadio>
              </NFlex>
            </NRadioGroup>
          </ControlItem>

          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.ban.delaySeconds.label')"
            :label-description="t('AutoSelect.ban.delaySeconds.description')"
            :label-width="260"
          >
            <NInputNumber
              size="small"
              style="width: 120px"
              :value="currentBanConfig.delaySeconds"
              @update:value="
                (val) => as.setBanConfig(currentGroup!.groupId, { delaySeconds: val || 0 })
              "
            />
          </ControlItem>
        </NTabPane>
      </NTabs>

      <!-- 一般来说这里不会抵达 -->
      <div class="as-editor__empty-selected-group" v-else>
        <div class="as-editor__empty-selected-group-title">{{ t('AutoSelect.groupEmpty') }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ControlItem from '@renderer-shared/components/ControlItem.vue'
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

import OrderedChampionList from '@main-window/components/ordered-champion-list/OrderedChampionList.vue'
import { useMapAssets } from '@main-window/compositions/useMapAssets'

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

<style scoped>
.as-editor {
  display: flex;
  flex-direction: column;
}

.as-editor__temporary-disabled {
  margin-bottom: 16px;

  .as-editor__temporary-disabled-description {
    margin-bottom: 4px;
  }
}

.as-editor__groups-container {
  display: flex;
  gap: 16px;
}

.as-editor__selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.as-editor__tab-title,
.as-editor__mode-list-title {
  font-size: 11px;
  color: #fff8;
  margin-bottom: 4px;
}

.as-editor__tabs-sections {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.as-editor__tabs-section {
  .as-editor__tab-title {
    font-size: 11px;
    color: #fff8;
    margin-bottom: 4px;
  }

  &:last-child {
    margin-bottom: 16px;
  }
}

.as-editor__mode-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.as-editor__groups-title {
  color: #fff8;
  font-size: 12px;
  margin-left: 8px;
  margin-bottom: 4px;
}

.as-editor__groups-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.as-editor__group-item {
  display: flex;
  align-items: center;
  font-size: 13px;
  height: 28px;
  color: #fffa;
  padding: 0 8px;
  border-radius: 4px;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
  width: 180px;

  .as-editor__group-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .as-editor__group-icon {
    margin-right: 8px;
  }

  .as-editor__group-enabled-icon-wrapper {
    display: flex;
    gap: 4px;
    margin-left: auto;
  }

  .as-editor__group-enabled-icon {
    font-size: 14px;
  }

  .as-editor__group-enabled-icon--ban {
    color: #ffa436;
  }

  .as-editor__group-enabled-icon--pick {
    color: #00ff00;
  }

  &:hover {
    background-color: #fff1;
    color: #fff;
  }

  &.as-editor__group-item--current {
    background-color: #fff2;
    color: #fff;
  }
}

.as-editor__group-icon {
  width: 18px;
  height: 18px;
}

.as-editor__radio-button-inner {
  position: relative;
  display: flex;
  align-items: center;
  font-size: 12px;
  gap: 4px;
}

.as-editor__empty-group,
.as-editor__empty-selected-group {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.as-editor__empty-group-title,
.as-editor__empty-selected-group-title {
  font-size: 12px;
  color: #fff8;
}

.as-editor__subtitle {
  font-size: 12px;
  color: #fff8;
  margin-bottom: 8px;
}

.as-editor__spacer {
  height: 8px;
}

.as-editor__bench-options-divider {
  border-top: 1px solid #fff2;
  margin-bottom: 12px;
}

.as-editor__position {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 4px;

  .as-editor__position-icon {
    color: #fff;
    font-size: 20px;
    flex-shrink: 0;
  }
}
</style>
