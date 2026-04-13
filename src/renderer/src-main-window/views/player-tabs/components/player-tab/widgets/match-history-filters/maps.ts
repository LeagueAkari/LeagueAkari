import AndOr from './combinator-components/AndOr.vue'
import AnyOrEvery from './combinator-components/AnyOrEvery.vue'
import GameTypeCheck from './combinator-components/GameTypeCheck.vue'
import HasAugment from './combinator-components/HasAugment.vue'
import HasItem from './combinator-components/HasItem.vue'
import HasPlayer from './combinator-components/HasPlayer.vue'
import HasSpell from './combinator-components/HasSpell.vue'
import IsChampion from './combinator-components/IsChampion.vue'
import IsPosition from './combinator-components/IsPosition.vue'
import IsQueue from './combinator-components/IsQueue.vue'
import Not from './combinator-components/Not.vue'
import NumberBetween from './combinator-components/NumberBetween.vue'
import OfMembers from './combinator-components/OfMembers.vue'
import OfPlayer from './combinator-components/OfPlayer.vue'
import WinResult from './combinator-components/WinResult.vue'
import {
  // createAllCombinator,
  createAlliesCombinator,
  createAndCombinator,
  createAnyoneCombinator,
  createAssistsBetweenCombinator,
  createDeathsBetweenCombinator,
  createDurationBetweenCombinator,
  createEnemiesCombinator,
  createEveryoneCombinator,
  createGoldBetweenCombinator,
  createHasAugmentCombinator,
  createHasItemCombinator,
  createHasPlayerCombinator,
  createHasSpellCombinator,
  createIsAbortCombinator,
  createIsChampionCombinator,
  createIsLossCombinator,
  createIsMatchedGameCombinator,
  createIsPositionCombinator,
  createIsPveGameCombinator,
  createIsQueueCombinator,
  createIsRemakeCombinator,
  createIsWinCombinator,
  createKdaBetweenCombinator,
  createKillsBetweenCombinator,
  createNotCombinator,
  createOrCombinator,
  createPlayerCombinator
} from './combinator-factories'

export const COMPONENT_MAP = {
  and: AndOr,
  or: AndOr,
  not: Not,
  hasAugment: HasAugment,
  hasSpell: HasSpell,
  hasItem: HasItem,
  hasPlayer: HasPlayer,
  all: OfMembers,
  allies: OfMembers,
  enemies: OfMembers,
  player: OfPlayer,
  isChampion: IsChampion,
  anyone: AnyOrEvery,
  everyone: AnyOrEvery,
  isWin: WinResult,
  isLoss: WinResult,
  isAbort: WinResult,
  isRemake: WinResult,
  isQueue: IsQueue,
  isPosition: IsPosition,
  isMatchedGame: GameTypeCheck,
  isPveGame: GameTypeCheck,
  durationBetween: NumberBetween,
  kdaBetween: NumberBetween,
  killsBetween: NumberBetween,
  deathsBetween: NumberBetween,
  assistsBetween: NumberBetween,
  goldBetween: NumberBetween
}

/**
 * 一个 combinator 必须在什么 scope 下
 *
 * 某些 combinator 可以在多个 scope 正确执行
 */
export const REQUIRE_SCOPE_MAP = {
  game: [],
  and: ['game', 'participant', 'participants'],
  or: ['game', 'participant', 'participants'],
  not: ['game', 'participant', 'participants'],
  isQueue: ['game'],
  isAbort: ['game', 'participant', 'participants'],
  isRemake: ['game', 'participant', 'participants'],
  hasAugment: ['participant'],
  enemies: ['game'],
  allies: ['game'],
  all: ['game'],
  player: ['game', 'participants'],
  hasPlayer: ['game', 'participants'],
  anyone: ['game', 'participants'],
  everyone: ['game', 'participants'],
  hasSpell: ['participant'],
  isPosition: ['participant'],
  hasItem: ['participant'],
  isChampion: ['participant'],
  durationBetween: ['game'],
  kdaBetween: ['participant'],
  killsBetween: ['participant'],
  deathsBetween: ['participant'],
  assistsBetween: ['participant'],
  goldBetween: ['participant'],
  isWin: ['participant', 'participants'],
  isLoss: ['participant', 'participants'],
  isMatchedGame: ['game'],
  isPveGame: ['game']
}

/**
 * combinator 在下拉列表中的显示顺序（数值越小越靠前）
 *
 * 分组顺序：逻辑组合 → 对局属性 → 成员范围 → 胜负结果 → 参与者属性 → 数值范围
 */
export const COMBINATOR_ORDER_MAP = {
  // 逻辑组合
  game: 0,
  and: 1,
  or: 2,
  not: 3,
  // 对局属性
  isQueue: 10,
  isMatchedGame: 11,
  isPveGame: 12,
  isAbort: 13,
  isRemake: 14,
  durationBetween: 15,
  // 成员范围
  all: 20,
  allies: 21,
  enemies: 22,
  anyone: 23,
  everyone: 24,
  player: 25,
  hasPlayer: 26,
  // 胜负结果
  isWin: 30,
  isLoss: 31,
  // 参与者属性（英雄 / 位置 / 技能 / 装备等）
  isChampion: 40,
  isPosition: 41,
  hasSpell: 42,
  hasItem: 43,
  hasAugment: 44,
  // 数值范围
  kdaBetween: 50,
  killsBetween: 51,
  deathsBetween: 52,
  assistsBetween: 53,
  goldBetween: 54
}

export const COMBINATOR_FACTORY_MAP = {
  and: createAndCombinator,
  or: createOrCombinator,
  not: createNotCombinator,
  isQueue: createIsQueueCombinator,
  isAbort: createIsAbortCombinator,
  isRemake: createIsRemakeCombinator,
  hasAugment: createHasAugmentCombinator,
  enemies: createEnemiesCombinator,
  allies: createAlliesCombinator,
  // all: createAllCombinator, // 暂不需要
  anyone: createAnyoneCombinator,
  everyone: createEveryoneCombinator,
  hasSpell: createHasSpellCombinator,
  isPosition: createIsPositionCombinator,
  hasItem: createHasItemCombinator,
  isChampion: createIsChampionCombinator,
  durationBetween: createDurationBetweenCombinator,
  kdaBetween: createKdaBetweenCombinator,
  killsBetween: createKillsBetweenCombinator,
  deathsBetween: createDeathsBetweenCombinator,
  assistsBetween: createAssistsBetweenCombinator,
  goldBetween: createGoldBetweenCombinator,
  isWin: createIsWinCombinator,
  isLoss: createIsLossCombinator,
  player: createPlayerCombinator,
  hasPlayer: createHasPlayerCombinator,
  isMatchedGame: createIsMatchedGameCombinator,
  isPveGame: createIsPveGameCombinator
}

function buildAllowedCombinatorsMap(): Record<string, (keyof typeof REQUIRE_SCOPE_MAP)[]> {
  const scopeMap: Record<string, (keyof typeof REQUIRE_SCOPE_MAP)[]> = {}

  const sortedCombinators = (
    Object.keys(REQUIRE_SCOPE_MAP) as (keyof typeof REQUIRE_SCOPE_MAP)[]
  ).sort((a, b) => COMBINATOR_ORDER_MAP[a] - COMBINATOR_ORDER_MAP[b])

  for (const combinator of sortedCombinators) {
    for (const scope of REQUIRE_SCOPE_MAP[combinator]) {
      if (!COMBINATOR_FACTORY_MAP[combinator] || !COMPONENT_MAP[combinator]) {
        continue
      }

      scopeMap[scope] ??= []
      scopeMap[scope].push(combinator)
    }
  }

  return scopeMap
}

export const ALLOWED_COMBINATORS_MAP = buildAllowedCombinatorsMap()
