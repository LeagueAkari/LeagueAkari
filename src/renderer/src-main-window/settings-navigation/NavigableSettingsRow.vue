<template>
  <SettingsRow
    ref="row"
    v-bind="$attrs"
    :align="align"
    :control-full-line="controlFullLine"
    :disabled="disabled"
    :gap="gap"
    :highlighted="highlighted"
    :label="label"
    :label-description="labelDescription"
    :label-min-width="labelMinWidth"
    :label-width="labelWidth"
    :no-x-padding="noXPadding"
  >
    <template v-if="$slots.label" #label="slotProps">
      <slot name="label" v-bind="slotProps" />
    </template>
    <template v-if="$slots.labelDescription" #labelDescription="slotProps">
      <slot name="labelDescription" v-bind="slotProps" />
    </template>
    <slot />
  </SettingsRow>
</template>

<script setup lang="ts">
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import { computed, useTemplateRef } from 'vue'

import { useSettingsNavigationTarget } from './useSettingsNavigationTarget'

defineOptions({ inheritAttrs: false })

const { settingId } = defineProps<{
  settingId?: string
  label?: string
  labelDescription?: string
  labelWidth?: number
  labelMinWidth?: number
  gap?: number
  noXPadding?: boolean
  controlFullLine?: boolean
  align?: 'center' | 'start'
  disabled?: boolean
}>()

const row = useTemplateRef<{ getElement: () => HTMLElement | null }>('row')
const element = computed(() => row.value?.getElement() ?? null)
const highlighted = useSettingsNavigationTarget(settingId, element)
</script>
