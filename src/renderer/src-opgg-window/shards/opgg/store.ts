import {
  ModeType,
  OpggAramBalanceItem,
  PositionType,
  RegionType,
  TierType
} from '@shared/types/opgg'
import { defineStore } from 'pinia'
import { shallowReactive, shallowRef } from 'vue'

export const useOpggStore = defineStore('shard:opgg-renderer', () => {
  const frontendSettings = shallowReactive({
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

  const aramBalance = shallowRef<Record<number, OpggAramBalanceItem>>([])

  return {
    frontendSettings,
    savedPreferences,
    aramBalance
  }
})
