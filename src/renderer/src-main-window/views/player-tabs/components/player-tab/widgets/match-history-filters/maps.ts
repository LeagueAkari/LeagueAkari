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
  createAllCombinator,
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
  anyone: ['participants'],
  everyone: ['participants'],
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
 * combinator 被按照什么顺序排列
 *
 * 用于下拉列表的排序规则
 */
export const COMBINATOR_ORDER_MAP = {
  game: 0,
  and: 1,
  or: 2,
  not: 3,
  isQueue: 4,
  isAbort: 5,
  isRemake: 6,
  hasAugment: 7,
  enemies: 8,
  allies: 9,
  all: 10,
  anyone: 11,
  everyone: 12,
  isChampion: 13,
  durationBetween: 14,
  kdaBetween: 15,
  killsBetween: 16,
  deathsBetween: 17,
  assistsBetween: 18,
  goldBetween: 19,
  isWin: 20,
  isLoss: 21,
  isMatchedGame: 22,
  isPveGame: 23,
  player: 24,
  hasPlayer: 25,
  hasSpell: 26,
  isPosition: 27,
  hasItem: 28
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
  all: createAllCombinator,
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
