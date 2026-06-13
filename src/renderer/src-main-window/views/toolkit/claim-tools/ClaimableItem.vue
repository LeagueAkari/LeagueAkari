<template>
  <div class="flex flex-col">
    <div class="mb-3">
      <span class="text-sm font-bold">{{ translatedTitle }}</span>
    </div>
    <div class="flex flex-wrap gap-1">
      <RewardItem v-for="item of items" :key="item.id" :iconUrl="item.iconUrl" :name="item.name" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

import RewardItem from './RewardItem.vue'

const { t } = useTranslation()

const { items = [], title = '' } = defineProps<{
  title?: string
  items?: {
    id: string
    iconUrl: string
    name: string
  }[]
}>()

const translatedTitle = computed(() => {
  // "Placeholder Name for Reward Group DO NOT TRANSLATE"
  if (title.includes('DO NOT TRANSLATE')) {
    return t('ClaimableItem.untranslatedC', {
      count: items.length
    })
  }

  return title
})
</script>
