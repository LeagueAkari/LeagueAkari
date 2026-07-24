<template>
  <NPopover v-if="itemDisplay" :delay="50" :scrollable="true" style="max-height: 50vh">
    <template #trigger>
      <LcuImage
        :src="itemDisplay.iconPath"
        :style="{ width: `${size}px`, height: `${size}px` }"
        class="item"
        :class="{ trinket: isTrinket, item: !isTrinket }"
      />
    </template>

    <div class="info item-display-popover">
      <LcuImage class="image" :src="itemDisplay.iconPath" />
      <div class="right-side">
        <div class="name">
          {{ itemDisplay.name }}
          <span class="font-normal text-black/50 dark:text-white/50">({{ itemDisplay.id }})</span>
        </div>
        <div class="price">
          {{ itemDisplay.totalPrice }} G
          {{
            itemDisplay.price !== itemDisplay.totalPrice
              ? `(${t('gameAssets.item.combinePrice', {
                  gold: itemDisplay.price
                })})`
              : ''
          }}
        </div>
      </div>
    </div>

    <div class="from" v-if="itemDisplay.from.length !== 0">
      <LcuImage
        class="image"
        :title="componentItem.name"
        :src="componentItem.iconPath"
        v-for="componentItem of itemDisplay.from"
        :key="componentItem.id"
      />
    </div>

    <div class="to" v-if="itemDisplay.to.length !== 0">
      <LcuImage
        class="image"
        :title="componentItem.name"
        :src="componentItem.iconPath"
        v-for="componentItem of itemDisplay.to"
        :key="componentItem.id"
      />
    </div>

    <div
      :style="{ maxWidth: `${maxWidth}px` }"
      class="item-display-description text-xs"
      lol-view
      v-html="itemDisplay.descriptionHtml"
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
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { useTranslation } from 'i18next-vue'
import { NPopover } from 'naive-ui'
import { computed } from 'vue'

import LcuImage from '../LcuImage.vue'

const {
  itemId,
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

const resources = useAkariResourceProvider()
const itemDisplay = computed(() => {
  if (!itemId) {
    return null
  }

  return resources.items.display(itemId)
})
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
