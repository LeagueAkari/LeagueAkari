import {
  EarthOutline as AllIcon,
  ShieldHalf as EnemyIcon,
  People as FriendlyIcon
} from '@vicons/ionicons5'
import { useTranslation } from 'i18next-vue'
import type { Component } from 'vue'
import { computed } from 'vue'

import type { PresetTargetId } from '../types'

export interface PresetTarget {
  id: PresetTargetId
  label: string
  description: string
  buttonType: 'error' | 'primary' | 'default'
  icon: Component
}

export function usePresetTargets() {
  const { t } = useTranslation('renderer', { keyPrefix: 'toolkit.inGameSend.presets.targets' })

  return computed<PresetTarget[]>(() => [
    {
      id: 'friendly',
      label: t('friendly.label'),
      description: t('friendly.description'),
      buttonType: 'default',
      icon: FriendlyIcon
    },
    {
      id: 'enemy',
      label: t('enemy.label'),
      description: t('enemy.description'),
      buttonType: 'default',
      icon: EnemyIcon
    },
    {
      id: 'all',
      label: t('all.label'),
      description: t('all.description'),
      buttonType: 'default',
      icon: AllIcon
    }
  ])
}
