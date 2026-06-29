<template>
  <NPopover v-if="augmentId && lcs.gameData.augments[augmentId]" :delay="50">
    <template #trigger>
      <LcuImage
        :src="lcs.gameData.augments[augmentId].augmentSmallIconPath"
        v-bind="$attrs"
        :style="{ width: `${size}px`, height: `${size}px` }"
        class="augment"
        :class="{
          prismatic: lcs.gameData.augments[augmentId].rarity === 'kPrismatic',
          gold: lcs.gameData.augments[augmentId].rarity === 'kGold',
          silver: lcs.gameData.augments[augmentId].rarity === 'kSilver',
          bronze: lcs.gameData.augments[augmentId].rarity === 'kBronze'
        }"
      />
    </template>

    <div class="info max-w-45">
      <LcuImage class="image" :src="lcs.gameData.augments[augmentId].augmentSmallIconPath" />
      <div class="right-side">{{ lcs.gameData.augments[augmentId].nameTRA }}</div>
    </div>

    <div class="rarity max-w-45 text-xs">
      <span
        :class="{
          prismatic: lcs.gameData.augments[augmentId].rarity === 'kPrismatic',
          gold: lcs.gameData.augments[augmentId].rarity === 'kGold',
          silver:
            lcs.gameData.augments[augmentId].rarity === 'kSilver' ||
            lcs.gameData.augments[augmentId].rarity === 'kEventChoice',
          bronze: lcs.gameData.augments[augmentId].rarity === 'kBronze'
        }"
        class="rarity-indicator"
      ></span>
      {{ formatRarity(lcs.gameData.augments[augmentId].rarity) }}
    </div>

    <!-- for gtimg source -->
    <template v-if="as.settings.locale === 'zh-CN' && es.kiwiAugmentsMap?.[augmentId]?.tooltip">
      <div class="my-2 h-px bg-black/10 dark:bg-white/10" />
      <div class="max-w-100" v-html="es.kiwiAugmentsMap[augmentId].tooltip" />
    </template>
  </NPopover>
  <div
    v-else
    :style="{ width: `${size}px`, height: `${size}px` }"
    v-bind="$attrs"
    class="empty"
  ></div>
</template>

<script setup lang="ts">
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useExtraAssetsStore } from '@renderer-shared/shards/extra-assets/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NPopover } from 'naive-ui'

import LcuImage from '../LcuImage.vue'

const { size = 20 } = defineProps<{
  augmentId?: number
  size?: number
}>()

const as = useAppCommonStore()
const es = useExtraAssetsStore()
const lcs = useLeagueClientStore()

const { t } = useTranslation()

const formatRarity = (r: string) => {
  switch (r) {
    case 'kBronze':
      return t('gameAssets.augment.bronze')

    case 'kSilver':
      return t('gameAssets.augment.silver')

    case 'kEventChoice':
      return t('gameAssets.augment.eventChoice')

    case 'kGold':
      return t('gameAssets.augment.gold')

    case 'kPrismatic':
      return t('gameAssets.augment.prismatic')

    default:
      return t('gameAssets.augment.rarity', { rarity: r })
  }
}
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

@layer components {
  .augment,
  .empty {
    border-radius: 2px;
  }

  .augment {
    box-sizing: border-box;
  }

  .augment.prismatic {
    border: 1px solid transparent;
    border-image: linear-gradient(135deg, #e78fff, #8b05b0) 1;
    background-color: rgb(72, 59, 104);

    [data-theme='dark'] & {
      background-color: rgb(45, 37, 66);
    }
  }

  .augment.gold {
    border: 1px solid rgb(255, 183, 0);
    background-color: hsl(43, 82%, 20%);

    [data-theme='dark'] & {
      background-color: rgb(50, 37, 5);
    }
  }

  .augment.silver {
    border: 1px solid rgb(180, 180, 180);
    background-color: rgb(65, 77, 88);

    [data-theme='dark'] & {
      background-color: rgb(35, 35, 34);
    }
  }

  .augment.bronze {
    border: 1px solid rgb(205, 127, 50);
    background-color: rgb(80, 50, 25);

    [data-theme='dark'] & {
      background-color: rgb(50, 30, 15);
    }
  }

  .info {
    display: flex;
    align-items: center;
    margin-bottom: 8px;

    .image {
      border-radius: 4px;
      height: 28px;

      [data-theme='light'] & {
        filter: invert(100%);
      }
    }

    .right-side {
      margin-left: 8px;
      font-size: 12px;
      font-weight: bold;
    }
  }

  .empty {
    @apply bg-gray-500/40 dark:bg-black/20;
  }

  .rarity-indicator {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 2px;
    background-color: rgb(0, 0, 0);
  }

  .rarity-indicator.silver {
    background-color: rgb(247, 247, 247);
  }

  .rarity-indicator.gold {
    background-color: rgb(255, 183, 0);
  }

  .rarity-indicator.prismatic {
    background-image: linear-gradient(135deg, #f6d7ff, #b453cf);
  }

  .rarity-indicator.bronze {
    background-color: rgb(205, 127, 50);
  }
}
</style>
