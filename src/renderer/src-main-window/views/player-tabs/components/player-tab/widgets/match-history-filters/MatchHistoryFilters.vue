<template>
  <div
    class="box-border flex size-full flex-col gap-3 rounded-lg border border-solid border-white/10 bg-neutral-100 p-3 dark:bg-neutral-900"
  >
    <div
      class="flex items-center justify-between gap-3 rounded-lg border border-solid border-black/8 bg-black/2 px-3 py-2 dark:border-white/10 dark:bg-white/3"
    >
      <div class="flex min-w-0 items-start gap-3">
        <NIcon class="mt-0.5 text-base"><Filter20Regular /></NIcon>
        <div class="min-w-0 flex-1">
          <div class="text-base font-bold">{{ t('PlayerTab.filter.title') }}</div>
          <div class="mt-1 text-xs text-black/55 dark:text-white/50">
            {{ t('PlayerTab.filter.subtitle') }}
          </div>
        </div>
      </div>

      <!-- 测试例子 -->
      <!-- 例子：筛选【海克斯大乱斗中，对方阵营有“杰斯”，且它的第一个海克斯为“一板一眼”但最终我方胜利】的对局 -->
      <!-- 例子：筛选【我作为打野，在对局前十分钟内击杀了超过 10 个人，且总补刀数量超过 300 个】的对局 -->
      <!-- 例子：筛选【海克斯大乱斗中，整局四个海克斯都是彩色或都是金色，且任何一名玩家有装备“心之钢”】的对局 -->

      <!-- 条件构建器  -->
      <div class="ml-auto flex items-center gap-4">
        <NButton
          :disabled="!rootHasCombinator"
          tertiary
          size="tiny"
          type="warning"
          @click="clearFilters"
        >
          <template #icon>
            <NIcon size="14"><RefreshFilled /></NIcon>
          </template>
          {{ t('PlayerTab.filter.resetAll') }}
        </NButton>

        <TooltipWithIcon class="text-black/60 dark:text-white/60">
          <template #tooltip>
            <div class="max-w-60 space-y-2">
              <div>
                $收集模式会按照设定的筛选条件，自动从初始页开始收集数页战绩数据，直到满足预期数量或达到最大拉取限制为止。
              </div>
              <div>$这个功能适合将那些散落在多个战绩页的对局，集中收集在一起。</div>
            </div>
          </template>

          <NButton
            :disabled="!rootHasCombinator"
            tertiary
            size="tiny"
            type="primary"
            @click="handleOpenCollectModeSettingsModal"
          >
            $以当前筛选条件开始收集
          </NButton>
        </TooltipWithIcon>
      </div>
    </div>

    <div class="min-h-0 flex-1">
      <NScrollbar>
        <Game :nodeId="rootNode.id" />
      </NScrollbar>
    </div>

    <!-- 设置项 -->
    <NModal v-model:show="showCollectModeSettingsModal">
      <div
        class="rounded-lg border border-solid border-white/10 bg-neutral-100 p-3 dark:bg-neutral-900"
      >
        <div class="mb-3 text-base font-bold text-black dark:text-white">$收集设置</div>

        <div class="mb-3">
          <ControlItem
            class="control-item-margin"
            label="$每个轮次加载的战绩数量"
            label-description="$收集流程将依次拉取战绩页面，此处指定每次拉取的战绩数量"
            :label-width="400"
          >
            <NInputNumber
              :step="5"
              :max="200"
              :min="1"
              style="width: 160px"
              size="small"
              v-model:value="collectModeSettings.countPerIteration"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            label="$目标收集数量"
            label-description="$当符合条件的战绩达到指定数量时停止收集。避免过大值，因为可能导致性能问题"
            :label-width="400"
          >
            <NInputNumber
              :step="5"
              :max="1000"
              :min="1"
              style="width: 160px"
              size="small"
              v-model:value="collectModeSettings.expectedCount"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            label="$最大轮次"
            label-description="$收集流程不会永远进行下去，当轮次达到达到指定数量时仍未收集到预期数量时，收集流程将被停止"
            :label-width="400"
          >
            <NInputNumber
              :step="1"
              :max="100"
              :min="1"
              style="width: 160px"
              size="small"
              v-model:value="collectModeSettings.maxIteration"
            />
          </ControlItem>
        </div>

        <div class="flex justify-end gap-2">
          <NButton size="small" tertiary @click="handleCloseCollectModeSettingsModal"
            >$取消</NButton
          >
          <NButton type="primary" size="small" @click="handleCollect">$开始收集</NButton>
        </div>
      </div>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import TooltipWithIcon from '@renderer-shared/components/TooltipWithIcon.vue'
import { Filter20Regular } from '@vicons/fluent'
import { RefreshFilled } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NInputNumber, NModal, NScrollbar } from 'naive-ui'
import { ref } from 'vue'

import { useMatchHistory } from '../../data/match-history'
import { useMatchHistoryFilters } from '../../data/match-history-filters'
import Game from './combinator-components/Game.vue'

const { t } = useTranslation()

const {
  rootNode,
  rootHasCombinator,
  clearPredicate: clearFilters,
  predicate
} = useMatchHistoryFilters()

const { collectMatchHistory } = useMatchHistory()

const collectModeSettings = ref({
  countPerIteration: 20,
  expectedCount: 100,
  maxIteration: 10
})

const handleCollect = () => {
  collectMatchHistory({
    predicate: predicate.value,
    countPerIteration: 20,
    expectedCount: 100,
    maxIteration: 10,
    queryParams: {}
  })
}

const showCollectModeSettingsModal = ref(false)

const handleOpenCollectModeSettingsModal = () => {
  showCollectModeSettingsModal.value = true
}

const handleCloseCollectModeSettingsModal = () => {
  showCollectModeSettingsModal.value = false
}
</script>
