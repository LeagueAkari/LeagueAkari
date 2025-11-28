export const SPELL_SLOT_TYPE = {
  0: 'q',
  1: 'w',
  2: 'e',
  3: 'r',
  4: 'd',
  5: 'f',
  7: 'item',
  63: 'passive',
  64: 'basic-attack',
  65: 'basic-attack-2',
  32764: 'unknown' // 未知特殊类型
}

// Cherry_Shopkeeper -> 火圈伤害

/**
 * 判断是否是物品使用，符合 {number}active 格式的技能名称
 * @param spellName 技能名称
 * @returns 物品ID
 */
export function isItemUsage(spellName: string): {
  itemId: number
} | null {
  const match = spellName.match(/^(\d+)active$/)
  if (match) {
    return {
      itemId: parseInt(match[1])
    }
  }
  return null
}

export function isCritAttack(spellName: string): boolean {
  return spellName.includes('critattack')
}

export function isBasicAttack(spellName: string): boolean {
  return spellName.includes('basicattack')
}

export function isAugmentSpell(spellName: string): boolean {
  return spellName.startsWith('augment_')
}
