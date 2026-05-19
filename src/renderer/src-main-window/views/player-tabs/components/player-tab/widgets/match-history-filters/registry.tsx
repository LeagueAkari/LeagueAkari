import {
  ArrowReset20Regular,
  Bot20Regular,
  Branch20Regular,
  BranchFork20Regular,
  BuildingRetailShield20Regular,
  CheckmarkCircle20Regular,
  CheckmarkStarburst20Regular,
  DataBarVertical20Regular,
  DismissCircle20Regular,
  DocumentQueue20Regular,
  Eye20Regular,
  Flash20Regular,
  FoodGrains20Regular,
  Games20Regular,
  Gauge20Regular,
  HeartPulse20Regular,
  Map20Regular,
  Money20Regular,
  MoneyHand20Regular,
  Navigation20Regular,
  NumberSymbol20Regular,
  People20Regular,
  PeopleAdd20Regular,
  PeopleSwap20Regular,
  PeopleTeam20Regular,
  Person20Regular,
  PersonTag20Regular,
  Prohibited20Regular,
  PuzzlePiece20Regular,
  Ribbon20Regular,
  Shield20Regular,
  ShoppingBagTag20Regular,
  Sparkle20Regular,
  Star20Regular,
  Target20Regular,
  Timer20Regular,
  Trophy20Regular
} from '@vicons/fluent'
import { NIcon } from 'naive-ui'
import { type DropdownMixedOption } from 'naive-ui/es/dropdown/src/interface'
import { type Component } from 'vue'

import AndOr from './combinator-components/AndOr.vue'
import AnyOrEvery from './combinator-components/AnyOrEvery.vue'
import GameTypeCheck from './combinator-components/GameTypeCheck.vue'
import GameValueSelect from './combinator-components/GameValueSelect.vue'
import HasAugment from './combinator-components/HasAugment.vue'
import HasItem from './combinator-components/HasItem.vue'
import HasPerk from './combinator-components/HasPerk.vue'
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
  createCsBetweenCombinator,
  createDamageDealtToChampionsBetweenCombinator,
  createDamageTakenBetweenCombinator,
  createDamageToTowersBetweenCombinator,
  createDeathsBetweenCombinator,
  createDgrBetweenCombinator,
  createDoubleKillsBetweenCombinator,
  createDurationBetweenCombinator,
  createEnemiesCombinator,
  createEveryoneCombinator,
  createGoldBetweenCombinator,
  createGoldSpentBetweenCombinator,
  createHasAugmentCombinator,
  createHasItemCombinator,
  createHasPerkCombinator,
  createHasPerkStyleCombinator,
  createHasPlayerCombinator,
  createHasSpellCombinator,
  createHealBetweenCombinator,
  createIsAbortCombinator,
  createIsChampionCombinator,
  createIsGameModeCombinator,
  createIsLossCombinator,
  createIsMapCombinator,
  createIsMatchedGameCombinator,
  createIsPositionCombinator,
  createIsPveGameCombinator,
  createIsQueueCombinator,
  createIsRemakeCombinator,
  createIsWinCombinator,
  createKdaBetweenCombinator,
  createKillParticipationBetweenCombinator,
  createKillsBetweenCombinator,
  createLevelBetweenCombinator,
  createMagicDamageDealtToChampionsBetweenCombinator,
  createMagicDamageTakenBetweenCombinator,
  createNotCombinator,
  createOrCombinator,
  createPentaKillsBetweenCombinator,
  createPhysicalDamageDealtToChampionsBetweenCombinator,
  createPhysicalDamageTakenBetweenCombinator,
  createPlayerCombinator,
  createQuadraKillsBetweenCombinator,
  createSoloKillsBetweenCombinator,
  createTimeCCingOthersBetweenCombinator,
  createTripleKillsBetweenCombinator,
  createTrueDamageDealtToChampionsBetweenCombinator,
  createTrueDamageTakenBetweenCombinator,
  createVisionScoreBetweenCombinator
} from './combinator-factories'
import { type CombinatorNode } from './combinator-nodes'
import { isCombinatorAvailableInScope } from './combinator-specs'

type CombinatorCategory =
  | 'logic'
  | 'gameConditions'
  | 'matchConditions'
  | 'resultConditions'
  | 'participantConditions'
  | 'statConditions'
type CombinatorFactory = (parentId: string, options?: any) => CombinatorNode
type IconComponent = typeof Games20Regular

type CombinatorRegistryEntry = {
  category: CombinatorCategory
  order: number
  icon: IconComponent
  component?: Component
  factory?: CombinatorFactory
}

export const COMBINATOR_REGISTRY = {
  game: {
    category: 'logic',
    order: 0,
    icon: Games20Regular
  },
  and: {
    category: 'logic',
    order: 1,
    icon: Branch20Regular,
    component: AndOr,
    factory: createAndCombinator
  },
  or: {
    category: 'logic',
    order: 2,
    icon: BranchFork20Regular,
    component: AndOr,
    factory: createOrCombinator
  },
  not: {
    category: 'logic',
    order: 3,
    icon: Prohibited20Regular,
    component: Not,
    factory: createNotCombinator
  },
  isQueue: {
    category: 'gameConditions',
    order: 10,
    icon: DocumentQueue20Regular,
    component: IsQueue,
    factory: createIsQueueCombinator
  },
  isGameMode: {
    category: 'gameConditions',
    order: 11,
    icon: Games20Regular,
    component: GameValueSelect,
    factory: createIsGameModeCombinator
  },
  isMap: {
    category: 'gameConditions',
    order: 12,
    icon: Map20Regular,
    component: GameValueSelect,
    factory: createIsMapCombinator
  },
  isMatchedGame: {
    category: 'gameConditions',
    order: 13,
    icon: CheckmarkCircle20Regular,
    component: GameTypeCheck,
    factory: createIsMatchedGameCombinator
  },
  isPveGame: {
    category: 'gameConditions',
    order: 14,
    icon: Bot20Regular,
    component: GameTypeCheck,
    factory: createIsPveGameCombinator
  },
  isAbort: {
    category: 'gameConditions',
    order: 15,
    icon: DismissCircle20Regular,
    component: WinResult,
    factory: createIsAbortCombinator
  },
  isRemake: {
    category: 'gameConditions',
    order: 16,
    icon: ArrowReset20Regular,
    component: WinResult,
    factory: createIsRemakeCombinator
  },
  durationBetween: {
    category: 'gameConditions',
    order: 17,
    icon: Timer20Regular,
    component: NumberBetween,
    factory: createDurationBetweenCombinator
  },
  all: {
    category: 'matchConditions',
    order: 20,
    icon: People20Regular,
    component: OfMembers
  },
  allies: {
    category: 'matchConditions',
    order: 21,
    icon: PeopleTeam20Regular,
    component: OfMembers,
    factory: createAlliesCombinator
  },
  enemies: {
    category: 'matchConditions',
    order: 22,
    icon: PeopleSwap20Regular,
    component: OfMembers,
    factory: createEnemiesCombinator
  },
  anyone: {
    category: 'matchConditions',
    order: 23,
    icon: Person20Regular,
    component: AnyOrEvery,
    factory: createAnyoneCombinator
  },
  everyone: {
    category: 'matchConditions',
    order: 24,
    icon: People20Regular,
    component: AnyOrEvery,
    factory: createEveryoneCombinator
  },
  player: {
    category: 'matchConditions',
    order: 25,
    icon: Person20Regular,
    component: OfPlayer,
    factory: createPlayerCombinator
  },
  hasPlayer: {
    category: 'matchConditions',
    order: 26,
    icon: PersonTag20Regular,
    component: HasPlayer,
    factory: createHasPlayerCombinator
  },
  isWin: {
    category: 'resultConditions',
    order: 30,
    icon: Trophy20Regular,
    component: WinResult,
    factory: createIsWinCombinator
  },
  isLoss: {
    category: 'resultConditions',
    order: 31,
    icon: DismissCircle20Regular,
    component: WinResult,
    factory: createIsLossCombinator
  },
  isChampion: {
    category: 'participantConditions',
    order: 40,
    icon: Star20Regular,
    component: IsChampion,
    factory: createIsChampionCombinator
  },
  isPosition: {
    category: 'participantConditions',
    order: 41,
    icon: Navigation20Regular,
    component: IsPosition,
    factory: createIsPositionCombinator
  },
  hasSpell: {
    category: 'participantConditions',
    order: 42,
    icon: Flash20Regular,
    component: HasSpell,
    factory: createHasSpellCombinator
  },
  hasItem: {
    category: 'participantConditions',
    order: 43,
    icon: ShoppingBagTag20Regular,
    component: HasItem,
    factory: createHasItemCombinator
  },
  hasAugment: {
    category: 'participantConditions',
    order: 44,
    icon: PuzzlePiece20Regular,
    component: HasAugment,
    factory: createHasAugmentCombinator
  },
  hasPerk: {
    category: 'participantConditions',
    order: 45,
    icon: Sparkle20Regular,
    component: HasPerk,
    factory: createHasPerkCombinator
  },
  hasPerkStyle: {
    category: 'participantConditions',
    order: 46,
    icon: Ribbon20Regular,
    component: HasPerk,
    factory: createHasPerkStyleCombinator
  },
  kdaBetween: {
    category: 'statConditions',
    order: 50,
    icon: NumberSymbol20Regular,
    component: NumberBetween,
    factory: createKdaBetweenCombinator
  },
  killsBetween: {
    category: 'statConditions',
    order: 51,
    icon: Target20Regular,
    component: NumberBetween,
    factory: createKillsBetweenCombinator
  },
  deathsBetween: {
    category: 'statConditions',
    order: 52,
    icon: DismissCircle20Regular,
    component: NumberBetween,
    factory: createDeathsBetweenCombinator
  },
  assistsBetween: {
    category: 'statConditions',
    order: 53,
    icon: PeopleAdd20Regular,
    component: NumberBetween,
    factory: createAssistsBetweenCombinator
  },
  goldBetween: {
    category: 'statConditions',
    order: 54,
    icon: Money20Regular,
    component: NumberBetween,
    factory: createGoldBetweenCombinator
  },
  goldSpentBetween: {
    category: 'statConditions',
    order: 55,
    icon: MoneyHand20Regular,
    component: NumberBetween,
    factory: createGoldSpentBetweenCombinator
  },
  levelBetween: {
    category: 'statConditions',
    order: 56,
    icon: CheckmarkStarburst20Regular,
    component: NumberBetween,
    factory: createLevelBetweenCombinator
  },
  csBetween: {
    category: 'statConditions',
    order: 57,
    icon: FoodGrains20Regular,
    component: NumberBetween,
    factory: createCsBetweenCombinator
  },
  killParticipationBetween: {
    category: 'statConditions',
    order: 58,
    icon: PeopleTeam20Regular,
    component: NumberBetween,
    factory: createKillParticipationBetweenCombinator
  },
  damageDealtToChampionsBetween: {
    category: 'statConditions',
    order: 59,
    icon: Target20Regular,
    component: NumberBetween,
    factory: createDamageDealtToChampionsBetweenCombinator
  },
  physicalDamageDealtToChampionsBetween: {
    category: 'statConditions',
    order: 60,
    icon: DataBarVertical20Regular,
    component: NumberBetween,
    factory: createPhysicalDamageDealtToChampionsBetweenCombinator
  },
  magicDamageDealtToChampionsBetween: {
    category: 'statConditions',
    order: 61,
    icon: DataBarVertical20Regular,
    component: NumberBetween,
    factory: createMagicDamageDealtToChampionsBetweenCombinator
  },
  trueDamageDealtToChampionsBetween: {
    category: 'statConditions',
    order: 62,
    icon: DataBarVertical20Regular,
    component: NumberBetween,
    factory: createTrueDamageDealtToChampionsBetweenCombinator
  },
  damageTakenBetween: {
    category: 'statConditions',
    order: 63,
    icon: Shield20Regular,
    component: NumberBetween,
    factory: createDamageTakenBetweenCombinator
  },
  physicalDamageTakenBetween: {
    category: 'statConditions',
    order: 64,
    icon: Shield20Regular,
    component: NumberBetween,
    factory: createPhysicalDamageTakenBetweenCombinator
  },
  magicDamageTakenBetween: {
    category: 'statConditions',
    order: 65,
    icon: Shield20Regular,
    component: NumberBetween,
    factory: createMagicDamageTakenBetweenCombinator
  },
  trueDamageTakenBetween: {
    category: 'statConditions',
    order: 66,
    icon: Shield20Regular,
    component: NumberBetween,
    factory: createTrueDamageTakenBetweenCombinator
  },
  damageToTowersBetween: {
    category: 'statConditions',
    order: 67,
    icon: BuildingRetailShield20Regular,
    component: NumberBetween,
    factory: createDamageToTowersBetweenCombinator
  },
  healBetween: {
    category: 'statConditions',
    order: 68,
    icon: HeartPulse20Regular,
    component: NumberBetween,
    factory: createHealBetweenCombinator
  },
  visionScoreBetween: {
    category: 'statConditions',
    order: 69,
    icon: Eye20Regular,
    component: NumberBetween,
    factory: createVisionScoreBetweenCombinator
  },
  timeCCingOthersBetween: {
    category: 'statConditions',
    order: 70,
    icon: Timer20Regular,
    component: NumberBetween,
    factory: createTimeCCingOthersBetweenCombinator
  },
  dgrBetween: {
    category: 'statConditions',
    order: 71,
    icon: Gauge20Regular,
    component: NumberBetween,
    factory: createDgrBetweenCombinator
  },
  soloKillsBetween: {
    category: 'statConditions',
    order: 72,
    icon: Target20Regular,
    component: NumberBetween,
    factory: createSoloKillsBetweenCombinator
  },
  doubleKillsBetween: {
    category: 'statConditions',
    order: 73,
    icon: CheckmarkStarburst20Regular,
    component: NumberBetween,
    factory: createDoubleKillsBetweenCombinator
  },
  tripleKillsBetween: {
    category: 'statConditions',
    order: 74,
    icon: CheckmarkStarburst20Regular,
    component: NumberBetween,
    factory: createTripleKillsBetweenCombinator
  },
  quadraKillsBetween: {
    category: 'statConditions',
    order: 75,
    icon: CheckmarkStarburst20Regular,
    component: NumberBetween,
    factory: createQuadraKillsBetweenCombinator
  },
  pentaKillsBetween: {
    category: 'statConditions',
    order: 76,
    icon: CheckmarkStarburst20Regular,
    component: NumberBetween,
    factory: createPentaKillsBetweenCombinator
  }
} as const satisfies Record<string, CombinatorRegistryEntry>

export type CombinatorKey = keyof typeof COMBINATOR_REGISTRY
const registryEntries = Object.entries(COMBINATOR_REGISTRY) as [
  CombinatorKey,
  CombinatorRegistryEntry
][]

const COMBINATOR_CATEGORY_ORDER_MAP: Record<CombinatorCategory, number> = {
  logic: 0,
  gameConditions: 1,
  matchConditions: 2,
  resultConditions: 3,
  participantConditions: 4,
  statConditions: 5
}

const COMBINATOR_CATEGORY_LABEL_KEY_MAP: Record<CombinatorCategory, string> = {
  logic: 'logicGroups',
  gameConditions: 'gameConditions',
  matchConditions: 'matchConditions',
  resultConditions: 'resultConditions',
  participantConditions: 'participantConditions',
  statConditions: 'statConditions'
}

const COMBINATOR_CATEGORY_ICON_MAP: Record<CombinatorCategory, IconComponent> = {
  logic: Branch20Regular,
  gameConditions: Games20Regular,
  matchConditions: People20Regular,
  resultConditions: Trophy20Regular,
  participantConditions: PersonTag20Regular,
  statConditions: NumberSymbol20Regular
}

const isCombinatorKey = (value: string): value is CombinatorKey => value in COMBINATOR_REGISTRY

const getCombinatorDefinition = (key: string) => {
  if (!isCombinatorKey(key)) {
    return null
  }

  return COMBINATOR_REGISTRY[key] as CombinatorRegistryEntry
}

export const getCombinatorComponent = (key: string): Component | null => {
  return getCombinatorDefinition(key)?.component ?? null
}

export const createCombinatorNode = (key: string, parentId: string): CombinatorNode | null => {
  const factory = getCombinatorDefinition(key)?.factory

  if (!factory) {
    return null
  }

  return factory(parentId)
}

const getDropdownCombinators = (scope: string) => {
  return registryEntries
    .filter(([key, definition]) => {
      return (
        isCombinatorAvailableInScope(key, scope) && !!definition.component && !!definition.factory
      )
    })
    .sort(
      (a, b) =>
        COMBINATOR_CATEGORY_ORDER_MAP[a[1].category] -
          COMBINATOR_CATEGORY_ORDER_MAP[b[1].category] || a[1].order - b[1].order
    )
}

const renderIcon = (icon: IconComponent) => {
  const Icon = icon

  return () => (
    <NIcon>
      <Icon />
    </NIcon>
  )
}

export const createCombinatorDropdownOptions = (
  scope: string,
  t: (key: string) => string
): DropdownMixedOption[] => {
  const categoryOptions = new Map<CombinatorCategory, DropdownMixedOption[]>()
  const options: DropdownMixedOption[] = []

  for (const [key, definition] of getDropdownCombinators(scope)) {
    const category = definition.category
    const option: DropdownMixedOption = {
      label: t(`PlayerTab.filter.combinatorLabels.${key}`),
      key,
      icon: renderIcon(definition.icon)
    }

    if (category === 'logic') {
      options.push(option)
      continue
    }

    const children = categoryOptions.get(category) ?? []

    children.push(option)

    categoryOptions.set(category, children)
  }

  const categoryEntries = Object.entries(COMBINATOR_CATEGORY_ORDER_MAP)
    .toSorted((a, b) => a[1] - b[1])
    .flatMap(([category]) => {
      const typedCategory = category as CombinatorCategory

      if (typedCategory === 'logic') {
        return []
      }

      const children = categoryOptions.get(typedCategory)

      if (!children?.length) {
        return []
      }

      return [
        {
          label: t(`PlayerTab.filter.sections.${COMBINATOR_CATEGORY_LABEL_KEY_MAP[typedCategory]}`),
          key: `category-${typedCategory}`,
          icon: renderIcon(COMBINATOR_CATEGORY_ICON_MAP[typedCategory]),
          children
        }
      ]
    })

  if (options.length && categoryEntries.length) {
    options.push({
      type: 'divider',
      key: 'divider-logic-categories'
    })
  }

  return [...options, ...categoryEntries]
}
