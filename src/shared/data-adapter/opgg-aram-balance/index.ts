import type { OpggChampionBalance } from '@shared/types/champion-data/opgg'

type OpggAramBalanceField =
  | 'damage_dealt'
  | 'damage_taken'
  | 'attack_speed'
  | 'cooldown_reduction'
  | 'healing'
  | 'tenacity'
  | 'shield_amount'
  | 'energy_regen'
  | 'area_of_effect_damage'

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
    valueKey: 'damageDealt',
    type: 'damage-dealt',
    display: 'percentage',
    effectType: 'buff'
  },
  {
    field: 'damage_taken',
    valueKey: 'damageTaken',
    type: 'damage-taken',
    display: 'percentage',
    effectType: 'nerf'
  },
  {
    field: 'attack_speed',
    valueKey: 'attackSpeed',
    type: 'attack-speed',
    display: 'percentage',
    effectType: 'buff'
  },
  {
    field: 'cooldown_reduction',
    valueKey: 'abilityHaste',
    type: 'ability-haste',
    display: 'literal',
    effectType: 'buff'
  },
  {
    field: 'healing',
    valueKey: 'healing',
    type: 'healing',
    display: 'percentage',
    effectType: 'buff'
  },
  {
    field: 'tenacity',
    valueKey: 'tenacity',
    type: 'tenacity',
    display: 'literal',
    effectType: 'buff'
  },
  {
    field: 'shield_amount',
    valueKey: 'shieldAmount',
    type: 'shielding',
    display: 'percentage',
    effectType: 'buff'
  },
  {
    field: 'energy_regen',
    valueKey: 'energyRegen',
    type: 'energy-regen',
    display: 'percentage',
    effectType: 'buff'
  },
  {
    field: 'area_of_effect_damage',
    valueKey: 'areaOfEffectDamage',
    type: 'area-of-effect-damage',
    display: 'percentage',
    effectType: 'buff'
  }
] as const satisfies readonly {
  valueKey: Exclude<keyof OpggChampionBalance, 'championId'>
  field: OpggAramBalanceField
  type: OpggAramBalanceAdjustmentType
  display: OpggAramBalanceAdjustment['display']
  effectType: OpggAramBalanceAdjustment['effectType']
}[]

export function getOpggAramBalanceAdjustments(balance: OpggChampionBalance) {
  return BALANCE_DEFINITIONS.flatMap<OpggAramBalanceAdjustment>((definition, order) => {
    const value = balance[definition.valueKey]
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

    return [
      {
        field: definition.field,
        type: definition.type,
        display: definition.display,
        effectType: definition.effectType,
        value,
        effect,
        order
      }
    ]
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
