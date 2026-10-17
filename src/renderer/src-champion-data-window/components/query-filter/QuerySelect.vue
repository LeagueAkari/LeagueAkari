<template>
  <NSelect
    v-bind="$attrs"
    size="small"
    :theme-overrides="themeOverrides"
    :consistent-menu-width="false"
    :render-label="renderLabel ?? renderOption"
  />
</template>

<script setup lang="tsx">
import { NSelect, type SelectProps, type SelectRenderLabel } from 'naive-ui'

import FilterLabel from './FilterLabel.vue'

defineOptions({ inheritAttrs: false })

const { kind = 'text', renderLabel } = defineProps<{
  kind?: 'text' | 'position' | 'tier' | 'region'
  renderLabel?: SelectRenderLabel
}>()

// Match FilterLabel for placeholders and editable search text as well as selected options.
const themeOverrides: SelectProps['themeOverrides'] = {
  peers: {
    InternalSelection: { fontSizeSmall: 'var(--text-xs)' }
  }
}

const renderOption: SelectRenderLabel = (option) => (
  <FilterLabel
    label={String(option.label ?? '')}
    position={
      kind === 'position'
        ? String(option.value).toLowerCase().replace('support', 'utility')
        : undefined
    }
    rank={kind === 'tier' ? (option.rank as string) : undefined}
    icon={kind === 'tier' || kind === 'region' ? kind : undefined}
    flag={kind === 'region' ? (option.flag as string) : undefined}
  />
)
</script>
