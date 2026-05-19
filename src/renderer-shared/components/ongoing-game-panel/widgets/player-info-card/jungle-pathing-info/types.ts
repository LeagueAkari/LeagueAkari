import type {
  AggregatedAnalysis,
  AggregatedJungleAnalysis,
  GankPoint,
  JungleCamp
} from '@shared/data-adapter/analysis/player'

export type TeamSide = 'blue' | 'red'

export type FirstClearAndGankSummaryProps = {
  stats: AggregatedJungleAnalysis
}

export type JunglePathingInfoProps = {
  aggregatedAnalysis: AggregatedAnalysis
  currentChampionId?: number | null
}

export type JunglePathingTab = {
  key: string
  label: string
  stats: AggregatedJungleAnalysis
  championId: number | null
}

export type AlgorithmDescriptionLine = {
  translation: string
  keywords: Record<string, string>
}

export type MapLanePoint = Pick<GankPoint, 'x' | 'y' | 'lane'>

export type GankMapHeatmapAccumulator = {
  weight: number
  leftSum: number
  topSum: number
  laneWeights: Record<MapLanePoint['lane'], number>
}

export type GankMapHeatmapCell = {
  key: string
  left: number
  top: number
  lane: MapLanePoint['lane']
  size: number
  opacity: number
  intensity: number
}

export type EarlyGankLevel = 3 | 4

export type FirstClearCampPointKind = 'own' | 'invade'

export type HighlightedTranslationSlotValues = Record<string, string>

export type HighlightedTranslationData = {
  translation: string
  values: HighlightedTranslationSlotValues
  textClass: string
}

export type FirstClearRow = {
  side: TeamSide
  label: string
  indicatorClass: string
  own: HighlightedTranslationData
  invade: HighlightedTranslationData
}

export type EarlyGankCell = HighlightedTranslationData

export type EarlyGankRow = {
  side: TeamSide
  label: string
  indicatorClass: string
  level3: EarlyGankCell
  level4: EarlyGankCell
}

export type FirstClearCampMapPointEntry = {
  side: TeamSide
  sideLabel: string
  indicatorClass: string
  kind: FirstClearCampPointKind
  kindLabel: string
  count: number
  kindTotal: number
  sideTotal: number
  lines: HighlightedTranslationData[]
}

export type FirstClearCampMapPoint = {
  left: number
  top: number
  camp: JungleCamp
  campLabel: string
  size: number
  hasInvade: boolean
  entries: FirstClearCampMapPointEntry[]
}
