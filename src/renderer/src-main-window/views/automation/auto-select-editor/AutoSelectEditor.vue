<template>
  <div class="as-editor">
    <!-- 可选分组列表 -->
    <div class="groups" v-if="as2.groups.length > 0">
      <div class="group-list-title">[生效模式]</div>
      <div class="group-list">
        <div
          class="group-list-item"
          :class="{ current: currentGroupId === group.groupId }"
          v-for="group in as2.groups"
          :key="group.groupId"
          @click="currentGroupId = group.groupId"
        >
          <LcuImage class="group-icon" :src="gameModeIconUri[group.targetGameMode]" />
          <span class="group-label">{{ group.groupId }}</span>
        </div>
      </div>
    </div>

    <div class="empty-group" v-else>
      <div class="empty-group-title">暂无分组</div>
    </div>

    <!-- 右侧配置区域 -->
    <NTabs
      size="small"
      type="line"
      animated
      class="config-section"
      v-if="currentGroup && currentPickConfig"
      v-model:value="banPick"
    >
      <NTabPane name="pick" tab="[英雄选择]">
        <ControlItem
          class="control-item-margin"
          :label="`[意向英雄]`"
          :label-description="`[自动选择将选择这些英雄，优先选择列表靠前的英雄]`"
          :label-width="260"
        >
          <NCollapseTransition :show="currentGroup.positions.length > 1">
            <div
              class="position-selector"
              v-for="position in currentGroup.positions"
              :key="position"
            >
              <NTooltip placement="left">
                <template #trigger>
                  <PositionIcon :position="position" class="position-icon" />
                </template>
                <span
                  >当分配到 <span style="font-weight: bold">{{ position }}</span> 位置时</span
                >
              </NTooltip>
              <OrderedChampionList
                type="pick"
                :allow-bravery="currentGroup.additionalPicks.includes(-3)"
                :allow-dummy="!currentGroup.excludedPicks.includes(-1)"
              />
            </div>
          </NCollapseTransition>
          <NCollapseTransition
            :show="currentGroup.positions.length === 1 && currentGroup.positions[0] === 'default'"
          >
            <div class="position-selector">
              <PositionIcon position="all" class="position-icon" />
              <OrderedChampionList
                type="pick"
                :allow-bravery="currentGroup.additionalPicks.includes(-3)"
                :allow-dummy="!currentGroup.excludedPicks.includes(-1)"
              />
            </div>
          </NCollapseTransition>
        </ControlItem>

        <ControlItem
          class="control-item-margin"
          :label="`[预选目标英雄]`"
          :label-description="`[自动选择时，将提前预选目标英雄]`"
          :label-width="260"
        >
          <NSwitch size="small" />
        </ControlItem>

        <ControlItem
          class="control-item-margin"
          :label="`[无视队友预选]`"
          :label-description="`[开启后，自动选择将不再考虑队友的预选英雄]`"
          :label-width="260"
        >
          <NSwitch size="small" />
        </ControlItem>

        <ControlItem
          class="control-item-margin"
          :label="`[锁定策略]`"
          :label-description="`[按照预设的策略，锁定与亮出目标英雄]`"
          :label-width="260"
        >
          <NRadioGroup size="small">
            <NFlex vertical :size="2">
              <NRadio value="show">仅亮出</NRadio>
              <NRadio value="lock-in">仅锁定</NRadio>
              <NRadio value="show-and-lock-in">亮出并锁定</NRadio>
            </NFlex>
          </NRadioGroup>
        </ControlItem>

        <ControlItem
          class="control-item-margin"
          :label="`延时 (s)`"
          :label-description="`[自动选择将根据预设的延时等分时间，依次执行预选、亮出和选用锁定步骤。每个阶段都不会超过系统限时]`"
          :label-width="260"
        >
          <NSwitch size="small" />
        </ControlItem>

        <div class="bench-mode-options-divider"></div>
        <div class="subtitle">[英雄备战席选项]</div>

        <ControlItem
          class="control-item-margin"
          :label="`备战席选用最低累积时间 (s)`"
          :label-description="`[待定文案]`"
          :label-width="260"
        >
          <NSwitch size="small" />
        </ControlItem>

        <ControlItem
          class="control-item-margin"
          :label="`优先选择首位`"
          :label-description="`[在目标英雄存在于备战席时，优先选择列表靠前的英雄]`"
          :label-width="260"
        >
          <NSwitch size="small" :value="currentPickConfig.benchSelectFirstAvailableChampion" />
        </ControlItem>

        <ControlItem
          class="control-item-margin"
          :label="`处理交换请求`"
          :label-description="`[直接用占位的]`"
          :label-width="260"
        >
          <NSwitch size="small" />
        </ControlItem>
      </NTabPane>

      <NTabPane name="ban" tab="[英雄禁用]">
        <ControlItem
          class="control-item-margin"
          :label="`[意向英雄]`"
          :label-description="`[自动禁用将选择这些英雄，优先选择列表靠前的英雄。按照位置选择]`"
          :label-width="260"
        >
          <NCollapseTransition :show="currentGroup.positions.length > 1">
            <div
              class="position-selector"
              v-for="position in currentGroup.positions"
              :key="position"
            >
              <NTooltip placement="left">
                <template #trigger>
                  <PositionIcon :position="position" class="position-icon" />
                </template>
                <span
                  >当分配到 <span style="font-weight: bold">{{ position }}</span> 位置时</span
                >
              </NTooltip>
              <OrderedChampionList
                type="ban"
                :allow-bravery="currentGroup.additionalBans.includes(-3)"
                :allow-dummy="!currentGroup.excludedBans.includes(-1)"
              />
            </div>
          </NCollapseTransition>

          <NCollapseTransition
            :show="currentGroup.positions.length === 1 && currentGroup.positions[0] === 'default'"
          >
            <div class="position-selector">
              <PositionIcon position="all" class="position-icon" />
              <OrderedChampionList
                type="ban"
                :allow-bravery="currentGroup.additionalBans.includes(-3)"
                :allow-dummy="!currentGroup.excludedBans.includes(-1)"
              />
            </div>
          </NCollapseTransition>
        </ControlItem>

        <ControlItem
          class="control-item-margin"
          :label="`[无视队友预选]`"
          :label-description="`[开启后，自动禁用将不再考虑队友的预选英雄]`"
          :label-width="260"
        >
          <NSwitch size="small" />
        </ControlItem>

        <ControlItem
          class="control-item-margin"
          :label="`[锁定策略]`"
          :label-description="`[按照预设的策略，锁定策略占位]`"
          :label-width="260"
        >
          <NRadioGroup size="small">
            <NFlex vertical :size="2">
              <NRadio value="show">仅亮出</NRadio>
              <NRadio value="lock-in">仅锁定</NRadio>
              <NRadio value="show-and-lock-in">亮出并锁定</NRadio>
            </NFlex>
          </NRadioGroup>
        </ControlItem>

        <ControlItem
          class="control-item-margin"
          :label="`延时 (s)`"
          :label-description="`[自动禁用将根据预设的延时等分时间，依次执行亮出和禁用锁定步骤。每个阶段都不会超过系统限时]`"
          :label-width="260"
        >
          <NSwitch size="small" />
        </ControlItem>
      </NTabPane>
    </NTabs>

    <div class="empty-selected-group" v-else>
      <div class="empty-selected-group-title">暂无分组</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import { useInstance } from '@renderer-shared/shards'
import { AutoSelectRenderer } from '@renderer-shared/shards/auto-select'
import { useAutoSelectStore } from '@renderer-shared/shards/auto-select/store'
import { useTranslation } from 'i18next-vue'
import {
  NCollapseTransition,
  NFlex,
  NRadio,
  NRadioButton,
  NRadioGroup,
  NSwitch,
  NTab,
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
const position = ref('default')

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
</script>

<style lang="less" scoped>
.selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.as-editor {
  display: flex;
  gap: 16px;
}

.tab-title,
.mode-list-title {
  font-size: 11px;
  color: #fff8;
  margin-bottom: 4px;
}

.tabs-sections {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tabs-section {
  .tab-title {
    font-size: 11px;
    color: #fff8;
    margin-bottom: 4px;
  }

  &:last-child {
    margin-bottom: 16px;
  }
}

.mode-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.group-list-title {
  color: #fff8;
  font-size: 12px;
  margin-left: 8px; // align with the first item
  margin-bottom: 4px;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.group-list-item {
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

  .group-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .group-icon {
    margin-right: 8px;
  }

  &:hover {
    background-color: #fff1;
    color: #fff;
  }

  &.current {
    background-color: #fff2;
    color: #fff;
  }
}

.group-icon {
  width: 18px;
  height: 18px;
}

.radio-button-inner {
  position: relative;
  display: flex;
  align-items: center;
  font-size: 12px;
  gap: 4px;
}

.empty-group,
.empty-selected-group {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.empty-group-title,
.empty-selected-group-title {
  font-size: 12px;
  color: #fff8;
}

.subtitle {
  font-size: 12px;
  color: #fff8;
  margin-bottom: 8px;
}

.spacer {
  height: 8px;
}

.bench-mode-options-divider {
  border-top: 1px solid #fff2;
  margin-bottom: 12px;
}

.position-selector {
  display: flex;
  gap: 8px;
  align-items: center;

  margin-bottom: 4px;

  .position-icon {
    color: #fff;
    font-size: 20px;
    flex-shrink: 0;
  }
}
</style>
