<template>
  <NTooltip>
    <template #trigger>
      <NButton
        size="small"
        circle
        tertiary
        :type="active ? 'warning' : 'default'"
        :disabled="disabled"
        @click="$emit('click')"
      >
        <template #icon>
          <NIcon size="16"><Delete20Regular /></NIcon>
        </template>
      </NButton>
    </template>
    {{ t('PlayerTab.clearFilters') }}
  </NTooltip>
</template>

<script setup lang="ts">
import { Delete20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NTooltip } from 'naive-ui'

defineProps<{
  active: boolean
  disabled: boolean
}>()

defineEmits<{
  click: []
}>()

const { t } = useTranslation()
</script>
