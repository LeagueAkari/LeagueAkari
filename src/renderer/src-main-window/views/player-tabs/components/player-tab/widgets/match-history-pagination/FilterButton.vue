<template>
  <NTooltip>
    <template #trigger>
      <NButton
        class="filter-toggle-button shrink-0"
        :class="{ 'filter-toggle-button--active': active }"
        :size="size"
        circle
        :secondary="active"
        :tertiary="!active"
        type="default"
        :disabled="disabled"
        @click="$emit('click')"
      >
        <template #icon>
          <NIcon :size="iconSize"><Filter20Regular /></NIcon>
        </template>
      </NButton>
    </template>
    {{ t('PlayerTab.filter.title') }}
  </NTooltip>
</template>

<script setup lang="ts">
import { Filter20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NTooltip } from 'naive-ui'
import { computed } from 'vue'

const {
  size = 'small',
  active = false,
  disabled = false
} = defineProps<{
  size?: 'tiny' | 'small'
  active?: boolean
  disabled?: boolean
}>()

defineEmits<{
  click: []
}>()

const { t } = useTranslation()

const iconSize = computed(() => (size === 'tiny' ? 14 : 16))
</script>

<style scoped>
.filter-toggle-button {
  position: relative;
}

.filter-toggle-button--active::after {
  content: '';
  position: absolute;
  top: 2px;
  right: 2px;
  z-index: 1;
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background-color: #f59e0b;
  box-shadow: 0 0 0 1px #fff;
  pointer-events: none;
}

[data-theme='dark'] .filter-toggle-button--active::after {
  box-shadow: 0 0 0 1px #171717;
}
</style>
