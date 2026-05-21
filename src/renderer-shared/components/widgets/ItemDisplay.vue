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

    <div class="info item-display-popover">
      <LcuImage class="image" :src="lcs.gameData.items[itemId].iconPath" />
      <div class="right-side">
        <div class="name">
          {{ lcs.gameData.items[itemId].name }}
          <span class="font-normal text-black/50 dark:text-white/50">({{ itemId }})</span>
        </div>
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
      class="item-display-description text-xs"
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
    @apply mb-2 flex items-center;

    .image {
      @apply size-7 rounded-xs;
    }

    .right-side {
      @apply ml-2;

      .name {
        @apply mb-1 text-xs leading-none font-bold;
      }

      .price {
        @apply text-xs leading-none;
      }
    }
  }

  .from {
    @apply mb-1 before:content-['='];
  }

  .to {
    @apply mb-2 before:content-['⇒'];
  }

  .from,
  .to {
    @apply flex max-w-[460px] flex-wrap items-center gap-0.5 before:mr-1 before:text-xs before:text-black/50 before:italic before:dark:text-white/50;

    .image {
      @apply size-5 rounded-xs;
    }
  }

  .item-display-popover,
  .item-display-description {
    color: var(--la-color-text-primary);
  }

  .item.trinket,
  .trinket.empty {
    @apply rounded-full;
  }

  .item,
  .item.empty {
    @apply shrink-0 rounded-xs;
  }

  .empty {
    @apply bg-gray-500/40 dark:bg-black/20;
  }
}
</style>
