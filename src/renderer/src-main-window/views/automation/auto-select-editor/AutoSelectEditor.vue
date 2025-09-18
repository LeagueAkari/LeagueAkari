<template>
  <div class="as-editor">
    <!-- 可选分组列表 -->
    <div class="as-editor__groups" v-if="as2.groups.length > 0">
      <div class="as-editor__groups-title">[生效模式]</div>
      <div class="as-editor__groups-list">
        <div
          class="as-editor__group-item"
          :class="{ 'as-editor__group-item--current': currentGroupId === group.groupId }"
          v-for="group in as2.groups"
          :key="group.groupId"
          @click="currentGroupId = group.groupId"
        >
          <LcuImage class="as-editor__group-icon" :src="gameModeIconUri[group.targetGameMode]" />
          <span class="as-editor__group-label">{{ group.groupId }}</span>
        </div>
      </div>
    </div>

    <!-- 一般来说这里不会抵达 -->
    <div class="as-editor__empty-group" v-else>
      <div class="as-editor__empty-group-title">[暂无分组]</div>
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
      <NTabPane name="pick" tab="[英雄选择]">
        <ControlItem
          class="control-item-margin"
          :label="`[启用]`"
          :label-description="`[启用该模式的自动选择]`"
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
          :label="`[意向英雄]`"
          :label-description="`[自动选择将选择这些英雄，优先选择列表靠前的英雄]`"
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
                  >当分配到 <span style="font-weight: bold">{{ position }}</span> 位置时</span
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
                  (val) => as.setPickConfig(currentGroup!.groupId, { champions: { default: val } })
                "
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
          <NSwitch
            size="small"
            :value="currentPickConfig.showIntent"
            @update:value="(val) => as.setPickConfig(currentGroup!.groupId, { showIntent: val })"
          />
        </ControlItem>

        <ControlItem
          class="control-item-margin"
          :label="`[无视队友预选]`"
          :label-description="`[开启后，自动选择将不再考虑队友的预选英雄]`"
          :label-width="260"
        >
          <NSwitch
            size="small"
            :value="currentPickConfig.ignoreIntent"
            @update:value="(val) => as.setPickConfig(currentGroup!.groupId, { ignoreIntent: val })"
          />
        </ControlItem>

        <ControlItem
          class="control-item-margin"
          :label="`[锁定策略]`"
          :label-description="`[按照预设的策略，锁定与亮出目标英雄]`"
          :label-width="260"
        >
          <NRadioGroup
            size="small"
            :value="currentPickConfig.strategy"
            @update:value="(val) => as.setPickConfig(currentGroup!.groupId, { strategy: val })"
          >
            <NFlex vertical :size="2">
              <NRadio value="just-show">仅亮出</NRadio>
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
          tooltip="[如极地大乱斗、无限乱斗等拥有英雄备战席的模式]"
        >
          <div>[英雄备战席选项]</div>
        </TooltipWithIcon>

        <ControlItem
          class="control-item-margin"
          :label="`备战席选用最低累积时间 (s)`"
          :label-description="`[仅当目标英雄出现在备战席上的累计时长超过此值时，才会执行交换操作]`"
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
          :label="`优先选择首位`"
          :label-description="`[在目标英雄存在于备战席时，优先选择列表靠前的英雄]`"
          :label-width="260"
        >
          <NSwitch
            size="small"
            :value="currentPickConfig.benchSelectFirstAvailableChampion"
            @update:value="
              (val) =>
                as.setPickConfig(currentGroup!.groupId, { benchSelectFirstAvailableChampion: val })
            "
          />
        </ControlItem>

        <ControlItem
          class="control-item-margin"
          :label="`处理交换请求`"
          :label-description="`[当收到交换请求时，若满足预期英雄设置，则接收交换请求。否则会拒绝交换请求]`"
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

      <NTabPane name="ban" tab="[英雄禁用]">
        <ControlItem
          class="control-item-margin"
          :label="`[启用]`"
          :label-description="`[启用该模式的自动禁用]`"
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
          :label="`[意向英雄]`"
          :label-description="`[自动禁用将选择这些英雄，优先选择列表靠前的英雄。按照位置选择]`"
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
                  >当分配到
                  <span style="font-weight: bold">{{
                    t(`positions.${position}`, { ns: 'common' })
                  }}</span>
                  位置时</span
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
          :label="`[无视队友预选]`"
          :label-description="`[开启后，自动禁用将不再考虑队友的预选英雄]`"
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
          :label="`[锁定策略]`"
          :label-description="`[按照预设的策略，锁定策略占位]`"
          :label-width="260"
        >
          <NRadioGroup
            size="small"
            :value="currentBanConfig.strategy"
            @update:value="(val) => as.setBanConfig(currentGroup!.groupId, { strategy: val })"
          >
            <NFlex vertical :size="2">
              <NRadio value="just-show">仅亮出</NRadio>
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
      <div class="as-editor__empty-selected-group-title">[暂无分组]</div>
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
import { useTranslation } from 'i18next-vue'
import {
  NCollapseTransition,
  NFlex,
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
</script>

<style scoped>
.as-editor__selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.as-editor {
  display: flex;
  gap: 16px;
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
