<template>
  <div class="as-editor">
    <div class="tabs-section">
      <div class="tab-title">[模式配置]</div>
      <div class="selector">
        <NRadioGroup v-model:value="queueType" size="small">
          <!-- CLASSIC 模式下的 排位队列 (SOLO/FLEX) -->
          <NRadioButton value="ranked">
            <div class="radio-button-inner">
              <LcuImage class="mode-icon" :src="gameModeIconUri['CLASSIC']" />
              <span>{{ t('ChampionConfig.ranked') }}</span>
            </div>
          </NRadioButton>

          <!-- CLASSIC 模式下的其他模式 -->
          <NRadioButton value="normal">
            <div class="radio-button-inner">
              <LcuImage class="mode-icon" :src="gameModeIconUri['CLASSIC']" />
              <span>{{ t('ChampionConfig.normal') }}</span>
            </div>
          </NRadioButton>

          <!-- URF 模式 -->
          <NRadioButton value="urf">
            <div class="radio-button-inner">
              <LcuImage class="mode-icon" :src="gameModeIconUri['URF']" />
              <span>{{ t('ChampionConfig.urf') }}</span>
            </div>
          </NRadioButton>

          <!-- 极限闪击 (但无 CS 环节) -->
          <!-- <NRadioButton value="nexusblitz">
            <div class="radio-button-inner">
              <LcuImage class="mode-icon" :src="gameModeIconUri['NEXUSBLITZ']" />
              <span>{{ t('ChampionConfig.nexusblitz') }}</span>
            </div>
          </NRadioButton> -->

          <!-- 终极魔典 -->
          <NRadioButton value="ultbook">
            <div class="radio-button-inner">
              <LcuImage class="mode-icon" :src="gameModeIconUri['ULTBOOK']" />
              <span>{{ t('ChampionConfig.ultbook') }}</span>
            </div>
          </NRadioButton>

          <!-- 还有一个神木之门 -->
          <NRadioButton value="brawl">
            <div class="radio-button-inner">
              <LcuImage class="mode-icon" :src="gameModeIconUri['BRAWL']" />
              <span>[神木之门]</span>
            </div>
          </NRadioButton>
        </NRadioGroup>
        <NRadioGroup v-model:value="queueType" size="small">
          <NRadioButton value="aram">
            <div class="radio-button-inner">
              <LcuImage class="mode-icon" :src="gameModeIconUri['ARAM']" />
              <span>[极地大乱斗]</span>
            </div>
          </NRadioButton>

          <!-- URF 的 ARURF 队列 -->
          <NRadioButton value="arurf">
            <div class="radio-button-inner">
              <LcuImage class="mode-icon" :src="gameModeIconUri['CLASSIC']" />
              <span>[无限乱斗]</span>
            </div>
          </NRadioButton>
        </NRadioGroup>
      </div>
    </div>
    <div class="tabs-sections">
      <div class="tabs-section">
        <div class="tab-title">[生效时机]</div>
        <NRadioGroup v-model:value="banPick" size="small">
          <NRadioButton value="pick">
            <div class="radio-button-inner">
              <span>英雄选择</span>
            </div>
          </NRadioButton>
          <NRadioButton value="ban">
            <div class="radio-button-inner">
              <span>英雄禁用</span>
            </div>
          </NRadioButton>
        </NRadioGroup>
      </div>
      <div class="tabs-section" v-show="queueType === 'ranked'">
        <div class="tab-title">[位置配置]</div>
        <NRadioGroup
          v-model:value="position"
          size="small"
          :theme-overrides="{
            labelPadding: '0 8px'
          }"
        >
          <NRadioButton value="default">
            <div class="radio-button-inner">
              <PositionIcon position="all" />
              <span>{{ t('ChampionConfig.default') }}</span>
            </div>
          </NRadioButton>
          <NRadioButton value="top">
            <div class="radio-button-inner">
              <PositionIcon position="top" />
              <span>{{ t('lanes.top', { ns: 'common' }) }}</span>
            </div>
          </NRadioButton>
          <NRadioButton value="jungle">
            <div class="radio-button-inner">
              <PositionIcon position="jungle" />
              <span>{{ t('lanes.jungle', { ns: 'common' }) }}</span>
            </div>
          </NRadioButton>
          <NRadioButton value="middle">
            <div class="radio-button-inner">
              <PositionIcon position="middle" />
              <span>{{ t('lanes.middle', { ns: 'common' }) }}</span>
            </div>
          </NRadioButton>
          <NRadioButton value="bottom">
            <div class="radio-button-inner">
              <PositionIcon position="bottom" />
              <span>{{ t('lanes.bottom', { ns: 'common' }) }}</span>
            </div>
          </NRadioButton>
          <NRadioButton value="utility">
            <div class="radio-button-inner">
              <PositionIcon position="utility" />
              <span>{{ t('lanes.utility', { ns: 'common' }) }}</span>
            </div>
          </NRadioButton>
        </NRadioGroup>
      </div>
      <NCollapseTransition :show="queueType === 'ranked'"> </NCollapseTransition>
    </div>
  </div>
</template>

<script lang="ts" setup>
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import { useTranslation } from 'i18next-vue'
import { NCollapseTransition, NRadioButton, NRadioGroup } from 'naive-ui'
import { computed, ref } from 'vue'

import { useMapAssets } from '@main-window/compositions/useMapAssets'

const { t } = useTranslation()

const queueType = ref('ranked')
const banPick = ref('pick')
const position = ref('default')

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

const typeToGameMode = (type: string) => {
  switch (type) {
    case 'ranked':
      return 'CLASSIC'
    case 'normal':
      return 'CLASSIC'
    case 'aram':
      return 'ARAM'
    case 'urf':
      return 'URF'
    case 'nexusblitz':
      return 'NEXUSBLITZ'
    case 'ultbook':
      return 'ULTBOOK'
    case 'brawl':
      return 'BRAWL'
  }

  return 'CLASSIC'
}
</script>

<style scoped>
.selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.as-editor {
  display: flex;

  .tabs-sections {
    display: flex;
    gap: 8px;
  }

  .tabs-section {
    margin-bottom: 8px;

    .tab-title {
      font-size: 11px;
      color: #fff8;
      margin-bottom: 4px;
    }

    &:last-child {
      margin-bottom: 16px;
    }
  }
}

.radio-button-inner {
  position: relative;
  display: flex;
  align-items: center;
  font-size: 12px;
  gap: 4px;

  .mode-icon {
    width: 16px;
    height: 16px;
  }
}
</style>
