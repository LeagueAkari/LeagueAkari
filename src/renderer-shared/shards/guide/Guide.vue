<template>
  <NPopover
    :show="store.activeGuideId === guideId"
    trigger="manual"
    :placement="placement"
    :show-arrow="true"
    :animated="true"
    raw
    :disabled="disabled"
  >
    <template #trigger>
      <slot />
    </template>
    <div class="guide-content">
      <div class="guide-content__title">{{ title }}</div>
      <div class="guide-content__description">{{ description }}</div>
      <div class="guide-content__actions">
        <NButton size="tiny" type="primary" @click="() => guide.confirm(groupId, guideId)">{{
          t('Guide.confirm')
        }}</NButton>
      </div>
    </div>
  </NPopover>
</template>

<script setup lang="ts">
import { useActivated } from '@renderer-shared/composables/useActivated'
import { useInstance } from '@renderer-shared/shards'
import { useTranslation } from 'i18next-vue'
import { NButton, NPopover } from 'naive-ui'
import { watch } from 'vue'

import { GuideRenderer } from '.'
import { useGuideStore } from './store'
import { ForwardedPlacementType } from './types'

const {
  groupId,
  guideId,
  title,
  description,
  order = 0,
  placement,
  disabled = false
} = defineProps<{
  groupId: string
  guideId: string
  title: string
  description: string
  order?: number // 越小越先显示
  placement?: ForwardedPlacementType
  disabled?: boolean
}>()

const { t } = useTranslation(undefined, { keyPrefix: 'Guide' })

const store = useGuideStore()

const isActivated = useActivated()
const guide = useInstance(GuideRenderer)

watch(
  () => isActivated.value,
  (yes) => {
    if (yes) {
      guide.register(groupId, guideId, order)
    } else {
      guide.unregister(groupId, guideId)
    }
  }
)
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

.guide-content {
  @apply bg-akari-500 max-w-65;
}

.guide-content__title {
  @apply mb-1 text-[13px] font-bold text-neutral-900 dark:text-neutral-400;
}

.guide-content__description {
  @apply mb-2 text-xs leading-normal text-neutral-950 dark:text-neutral-300;
}

.guide-content__actions {
  @apply flex justify-end gap-1.5;
}
</style>
