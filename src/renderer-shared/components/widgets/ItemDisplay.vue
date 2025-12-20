<template>
  <NPopover
    v-if="itemId && lcs.gameData.items[itemId]"
    :delay="50"
    :scrollable="true"
    style="max-height: 50vh"
  >
    <template #trigger>
      <LcuImage
        :src="lcs.gameData.items[itemId].iconPath"
        :style="{ width: `${size}px`, height: `${size}px` }"
        class="item"
        :class="{ trinket: isTrinket, item: !isTrinket }"
      />
    </template>

    <div class="info">
      <LcuImage class="image" :src="lcs.gameData.items[itemId].iconPath" />
      <div class="right-side">
        <div class="name">{{ lcs.gameData.items[itemId].name }} (ID: {{ itemId }})</div>
        <div class="price">
          {{ lcs.gameData.items[itemId].priceTotal }} G
          {{
            lcs.gameData.items[itemId].price !== lcs.gameData.items[itemId].priceTotal
              ? `(${t('ItemDisplay.combinePrice', {
                  gold: lcs.gameData.items[itemId].price
                })})`
              : ''
          }}
        </div>
      </div>
    </div>

    <div class="from" v-if="lcs.gameData.items[itemId].from.length !== 0">
      <LcuImage
        class="image"
        :title="lcs.gameData.items[item].name"
        :src="lcs.gameData.items[item].iconPath"
        v-for="item of lcs.gameData.items[itemId].from"
        :key="item"
      />
    </div>

    <div class="to" v-if="lcs.gameData.items[itemId].to.length !== 0">
      <LcuImage
        class="image"
        :title="lcs.gameData.items[item].name"
        :src="lcs.gameData.items[item].iconPath"
        v-for="item of lcs.gameData.items[itemId].to"
        :key="item"
      />
    </div>

    <div
      :style="{ maxWidth: `${maxWidth}px` }"
      class="text-xs"
      lol-view
      v-html="lcs.gameData.items[itemId].description"
    />
  </NPopover>

  <div
    v-else
    :style="{ width: `${size}px`, height: `${size}px` }"
    :class="{ trinket: isTrinket, item: !isTrinket }"
    v-bind="$attrs"
    class="empty"
  />
</template>

<script setup lang="ts">
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NPopover } from 'naive-ui'

import LcuImage from '../LcuImage.vue'

const {
  isTrinket = false,
  size = 20,
  maxWidth = 400
} = defineProps<{
  itemId?: number
  isTrinket?: boolean
  maxWidth?: number
  size?: number
}>()

const { t } = useTranslation()

const lcs = useLeagueClientStore()
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

@layer components {
  .info {
    margin-bottom: 8px;
    display: flex;
    align-items: center;

    .image {
      width: 28px;
      height: 28px;
      border-radius: 2px;
    }

    .right-side {
      margin-left: 8px;

      .name {
        font-size: 12px;
        line-height: 12px;
        font-weight: bold;
        margin-bottom: 4px;
      }

      .price {
        font-size: 12px;
        line-height: 12px;
      }
    }
  }

  .from {
    margin-bottom: 4px;

    &::before {
      content: '=';
    }
  }

  .to {
    margin-bottom: 8px;

    &::before {
      content: '⇒';
    }
  }

  .from,
  .to {
    display: flex;
    gap: 2px;
    align-items: center;
    max-width: 460px;
    flex-wrap: wrap;

    .image {
      width: 20px;
      height: 20px;
      border-radius: 2px;
    }

    &::before {
      font-size: 12px;
      font-style: italic;
      color: rgb(168, 168, 168);
      margin-right: 4px;
    }
  }

  .item.trinket,
  .trinket.empty {
    border-radius: 50%;
  }

  .item,
  .item.empty {
    flex-shrink: 0;
    border-radius: 2px;
  }

  .empty {
    @apply bg-gray-500/40 dark:bg-black/20;
  }
}
</style>
