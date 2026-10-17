import type { OpggChampionBalance } from '@shared/types/champion-data/opgg'
import { describe, expect, it } from 'vitest'

import { getOpggAramBalanceAdjustments, getOpggAramBalanceOverallEffect } from '.'

const defaultBalance: OpggChampionBalance = {
  championId: 1,
  attackSpeed: 100,
  damageDealt: 100,
  damageTaken: 100,
  abilityHaste: 0,
  healing: 100,
  tenacity: 0,
  shieldAmount: 100,
  energyRegen: 100,
  areaOfEffectDamage: 100
}

describe('OP.GG ARAM balance adapter', () => {
  it('omits unchanged values', () => {
    expect(getOpggAramBalanceAdjustments(defaultBalance)).toEqual([])
  })

  it('classifies positive and negative effects from their field semantics', () => {
    const adjustments = getOpggAramBalanceAdjustments({
      ...defaultBalance,
      damageDealt: 105,
      damageTaken: 105,
      abilityHaste: -10
    })

    expect(adjustments).toMatchObject([
      { type: 'damage-dealt', value: 105, effect: 'buffed' },
      { type: 'damage-taken', value: 105, effect: 'nerfed' },
      { type: 'ability-haste', value: -10, effect: 'nerfed' }
    ])
    expect(getOpggAramBalanceOverallEffect(adjustments)).toBe('mixed')
  })
})
