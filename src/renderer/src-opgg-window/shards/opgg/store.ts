import { ModeType, PositionType, RegionType, TierType } from '@shared/types/opgg'
import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'

export const useOpggStore = defineStore('shard:opgg-renderer', () => {
  const frontendSettings = shallowReactive({
    autoApply: false,
    autoApplyRunes: false,
    autoApplyItems: false,
    autoApplySpells: false
  })

  const savedPreferences = shallowReactive<{
    flashPosition: 'auto' | 'd' | 'f'
    mode: ModeType
    position: PositionType
    region: RegionType
    tier: TierType
  }>({
    flashPosition: 'auto',
    mode: 'ranked',
    position: 'top',
    region: 'global',
    tier: 'all'
  })

  return {
    savedPreferences,

    frontendSettings
  }
})
