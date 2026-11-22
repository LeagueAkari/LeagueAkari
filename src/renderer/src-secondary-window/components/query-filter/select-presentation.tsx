import type { SelectOption, SelectProps } from 'naive-ui'

import FilterLabel from './FilterLabel.vue'

export type FilterSelectEvents<T> = {
  'update:value': [value: T, option: SelectOption | null]
}

export const filterSelectDefaults = {
  size: 'small',
  consistentMenuWidth: false,
  themeOverrides: { peers: { InternalSelection: { fontSizeSmall: 'var(--text-xs)' } } },
  renderLabel: (option: SelectOption) => <FilterLabel label={String(option.label ?? '')} />
} satisfies SelectProps

export function renderPositionLabel(option: SelectOption) {
  return <FilterLabel label={String(option.label ?? '')} position={String(option.value)} />
}

export function renderTierLabel(option: SelectOption) {
  return (
    <FilterLabel
      label={String(option.label ?? '')}
      rank={typeof option.rank === 'string' ? option.rank : undefined}
      icon="tier"
    />
  )
}
