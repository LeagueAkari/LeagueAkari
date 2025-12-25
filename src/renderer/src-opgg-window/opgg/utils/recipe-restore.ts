const RECIPE_MAP = {
  // 魔切 -> 魔宗
  3042: 3004,
  223042: 223004,
  323042: 323004,

  // 炽天使之拥 -> 大天使之杖
  3040: 3003,
  223040: 223003,
  323040: 323003,

  // 凛冬之临 -> 末日寒冬
  3121: 3119,
  223121: 223119,
  323121: 323119
}

export function restoreRecipe(itemId: number) {
  return RECIPE_MAP[itemId] || itemId
}
