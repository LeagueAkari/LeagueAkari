import type { OpggAramBalanceItem } from '@shared/types/opgg'
import { describe, expect, it } from 'vitest'

import { getOpggAramBalanceAdjustments, getOpggAramBalanceOverallEffect } from '.'

const defaultBalance: OpggAramBalanceItem = {
  champion_id: 1,
  attack_speed: 100,
  damage_dealt: 100,
  damage_taken: 100,
  cooldown_reduction: 0,
  healing: 100,
  tenacity: 0,
  shield_amount: 100,
  energy_regen: 100,
  area_of_effect_damage: 100,
  default: true
}

describe('OP.GG ARAM balance adapter', () => {
  it('omits unchanged values', () => {
    expect(getOpggAramBalanceAdjustments(defaultBalance)).toEqual([])
  })

  it('classifies positive and negative effects from their field semantics', () => {
    const adjustments = getOpggAramBalanceAdjustments({
      ...defaultBalance,
      damage_dealt: 105,
      damage_taken: 105,
      cooldown_reduction: -10
    })

    expect(adjustments).toMatchObject([
      { type: 'damage-dealt', value: 105, effect: 'buffed' },
      { type: 'damage-taken', value: 105, effect: 'nerfed' },
      { type: 'ability-haste', value: -10, effect: 'nerfed' }
    ])
    expect(getOpggAramBalanceOverallEffect(adjustments)).toBe('mixed')
  })
})
