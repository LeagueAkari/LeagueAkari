import type { OpggAramBalanceItem } from '@shared/types/opgg'

type OpggAramBalanceField = Exclude<keyof OpggAramBalanceItem, 'champion_id' | 'default'>

export type OpggAramBalanceAdjustmentType =
  | 'damage-dealt'
  | 'damage-taken'
  | 'attack-speed'
  | 'ability-haste'
  | 'healing'
  | 'tenacity'
  | 'shielding'
  | 'energy-regen'
  | 'area-of-effect-damage'

export interface OpggAramBalanceAdjustment {
  field: OpggAramBalanceField
  type: OpggAramBalanceAdjustmentType
  value: number
  display: 'percentage' | 'literal'
  effectType: 'buff' | 'nerf'
  effect: 'buffed' | 'nerfed'
  order: number
}

const BALANCE_DEFINITIONS = [
  {
    field: 'damage_dealt',
    type: 'damage-dealt',
    display: 'percentage',
    effectType: 'buff'
  },
  {
    field: 'damage_taken',
    type: 'damage-taken',
    display: 'percentage',
    effectType: 'nerf'
  },
  {
    field: 'attack_speed',
    type: 'attack-speed',
    display: 'percentage',
    effectType: 'buff'
  },
  {
    field: 'cooldown_reduction',
    type: 'ability-haste',
    display: 'literal',
    effectType: 'buff'
  },
  {
    field: 'healing',
    type: 'healing',
    display: 'percentage',
    effectType: 'buff'
  },
  {
    field: 'tenacity',
    type: 'tenacity',
    display: 'literal',
    effectType: 'buff'
  },
  {
    field: 'shield_amount',
    type: 'shielding',
    display: 'percentage',
    effectType: 'buff'
  },
  {
    field: 'energy_regen',
    type: 'energy-regen',
    display: 'percentage',
    effectType: 'buff'
  },
  {
    field: 'area_of_effect_damage',
    type: 'area-of-effect-damage',
    display: 'percentage',
    effectType: 'buff'
  }
] as const satisfies readonly {
  field: OpggAramBalanceField
  type: OpggAramBalanceAdjustmentType
  display: OpggAramBalanceAdjustment['display']
  effectType: OpggAramBalanceAdjustment['effectType']
}[]

export function getOpggAramBalanceAdjustments(balance: OpggAramBalanceItem) {
  return BALANCE_DEFINITIONS.flatMap<OpggAramBalanceAdjustment>((definition, order) => {
    const value = balance[definition.field]
    const baseline = definition.display === 'percentage' ? 100 : 0

    if (value === baseline) {
      return []
    }

    const increased = value > baseline
    const effect =
      definition.effectType === 'buff'
        ? increased
          ? 'buffed'
          : 'nerfed'
        : increased
          ? 'nerfed'
          : 'buffed'

    return [{ ...definition, value, effect, order }]
  })
}

export function getOpggAramBalanceOverallEffect(adjustments: readonly OpggAramBalanceAdjustment[]) {
  const hasBuff = adjustments.some((adjustment) => adjustment.effect === 'buffed')
  const hasNerf = adjustments.some((adjustment) => adjustment.effect === 'nerfed')

  if (hasBuff && hasNerf) {
    return 'mixed' as const
  }

  if (hasBuff) {
    return 'buffed' as const
  }

  if (hasNerf) {
    return 'nerfed' as const
  }

  return 'neutral' as const
}
