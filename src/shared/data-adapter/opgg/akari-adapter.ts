import type { OpggChampionBalance } from '@shared/types/champion-data/opgg'

import type { OpggDecodedBalance } from './schemas'

export function toOpggChampionBalance(row: OpggDecodedBalance): OpggChampionBalance {
  return {
    championId: row.champion_id,
    attackSpeed: row.attack_speed,
    damageDealt: row.damage_dealt,
    damageTaken: row.damage_taken,
    abilityHaste: row.cooldown_reduction,
    healing: row.healing,
    tenacity: row.tenacity,
    shieldAmount: row.shield_amount,
    energyRegen: row.energy_regen,
    areaOfEffectDamage: row.area_of_effect_damage
  }
}
