<template>
  <div class="flex flex-wrap gap-1">
    <NButton
      v-if="showExclude && canExclude"
      tertiary
      size="tiny"
      :type="isExcluded ? 'warning' : undefined"
      @click="toggleExclude"
    >
      <template #icon>
        <NIcon size="14"><Prohibited20Regular /></NIcon>
      </template>
      {{ isExcluded ? t('PlayerTab.filter.removeExclude') : t('PlayerTab.filter.exclude') }}
    </NButton>

    <NButton v-if="showDelete" tertiary size="tiny" type="warning" @click="deleteCurrent">
      <template #icon>
        <NIcon size="14"><Delete20Regular /></NIcon>
      </template>
      {{ t('PlayerTab.filter.delete') }}
    </NButton>
  </div>
</template>

<script setup lang="ts">
import { Delete20Regular, Prohibited20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon } from 'naive-ui'

import { useNodeActions } from './use-node-actions'

const { t } = useTranslation()

const props = withDefaults(
  defineProps<{
    nodeId: string
    showDelete?: boolean
    showExclude?: boolean
  }>(),
  {
    showDelete: true,
    showExclude: true
  }
)

const { canExclude, isExcluded, deleteCurrent, toggleExclude } = useNodeActions(() => props.nodeId)
</script>
