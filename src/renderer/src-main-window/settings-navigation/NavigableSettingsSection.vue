<template>
  <SettingsSection
    ref="section"
    v-bind="$attrs"
    :footer="footer"
    :highlighted="highlighted"
    :no-bg="noBg"
    :title="title"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </SettingsSection>
</template>

<script setup lang="ts">
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { computed, useTemplateRef } from 'vue'

import { useSettingsNavigationTarget } from './useSettingsNavigationTarget'

defineOptions({ inheritAttrs: false })

const { settingId } = defineProps<{
  settingId?: string
  noBg?: boolean
  title?: string
  footer?: string
}>()

const section = useTemplateRef<{ getElement: () => HTMLElement | null }>('section')
const element = computed(() => section.value?.getElement() ?? null)
const highlighted = useSettingsNavigationTarget(settingId, element)
</script>
